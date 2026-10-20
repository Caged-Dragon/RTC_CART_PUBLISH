import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  authExchangeCodeForSession,
  authGetEnabledOAuthProviders,
  authGetUser,
  authPasswordSignIn,
  authProviderUrl,
  clearOAuthPkceState,
  authRefresh,
  authResetPassword,
  authSignOut,
  authSignUp,
  authUpdatePassword,
  clearSession,
  dbSelect,
  dbUpdate,
  getSession,
  getSupabaseErrorStatus,
  saveSession,
  SESSION_STORAGE_KEY,
  SupabaseAuthUser,
  SupabaseSession,
  AuthOAuthProviderName,
  EnabledOAuthProvider,
} from '../lib/supabase';

export interface UserProfile {
  id?: string;
  authUserId?: string;
  name: string;
  phone: string;
  email: string;
  city?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  authUser: SupabaseAuthUser | null;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  isPasswordRecovery: boolean;
  enabledOAuthProviders: EnabledOAuthProvider[];
  oauthProvidersLoading: boolean;
  oauthProvidersError: string | null;
  authCallbackError: string | null;
  clearAuthCallbackError: () => void;
  login: (name: string, phone: string, email?: string, password?: string) => Promise<void>;
  signup: (name: string, phone: string, email: string, password: string, city?: string) => Promise<'signed-in' | 'confirmation-required'>;
  loginWithProvider: (provider: AuthOAuthProviderName) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (details: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isTransientAuthFailure(error: unknown): boolean {
  const status = getSupabaseErrorStatus(error);
  return status === undefined || status === 429 || status >= 500;
}

function isDefinitiveAuthFailure(error: unknown): boolean {
  const status = getSupabaseErrorStatus(error);
  const code = String((error as { code?: string } | null)?.code || '').toLowerCase();
  const message = String((error as { message?: string } | null)?.message || '').toLowerCase();
  return status === 401 || status === 403 || (status === 400 && /invalid_grant|refresh_token_not_found|invalid refresh token|refresh token.*(not found|invalid|expired)|session.*not found/.test(`${code} ${message}`));
}


function profileFromRow(row: any, authUser?: SupabaseAuthUser | null): UserProfile {
  const metadata = authUser?.user_metadata || {};
  return {
    id: row?.id,
    authUserId: row?.auth_user_id || authUser?.id,
    name: row?.full_name || [row?.first_name, row?.last_name].filter(Boolean).join(' ') || metadata.full_name || '',
    phone: row?.phone_number || row?.phone || metadata.phone || authUser?.phone || '',
    email: row?.email || authUser?.email || '',
    city: row?.city || metadata.city || undefined,
    address: row?.street_address || row?.address_line_1,
    district: row?.district,
    state: row?.state,
    pincode: row?.pincode || row?.postal_code,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SupabaseSession | null>(() => getSession());
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(() => getSession()?.user || null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [enabledOAuthProviders, setEnabledOAuthProviders] = useState<EnabledOAuthProvider[]>([]);
  const [oauthProvidersLoading, setOAuthProvidersLoading] = useState(true);
  const [oauthProvidersError, setOAuthProvidersError] = useState<string | null>(null);
  const [authCallbackError, setAuthCallbackError] = useState<string | null>(null);

  const refreshProfile = async (sessionOverride?: SupabaseSession | null) => {
    const activeSession = sessionOverride === undefined ? session : sessionOverride;
    if (!activeSession?.user?.id) {
      setUser(null);
      return;
    }
    try {
      // This is profile data only. Credentials/passwords are exclusively handled by Supabase Auth.
      const rows = await dbSelect<any>(
        'users',
        `select=*&auth_user_id=eq.${encodeURIComponent(activeSession.user.id)}&limit=1`,
        activeSession.access_token,
      );
      setUser(rows[0] ? profileFromRow(rows[0], activeSession.user) : profileFromRow({}, activeSession.user));
    } catch (error) {
      console.error('Customer profile load failed', error);
      // Auth may succeed even if optional profile reads are briefly unavailable.
      setUser(profileFromRow({}, activeSession.user));
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      let current = getSession();
      try {
        const callbackUrl = new URL(window.location.href);
        const callbackError = callbackUrl.searchParams.get('error_description') || callbackUrl.searchParams.get('error');
        const authorizationCode = callbackUrl.searchParams.get('code');

        if (callbackError) {
          setAuthCallbackError(callbackError.replace(/\+/g, ' '));
          clearOAuthPkceState();
          ['error', 'error_description', 'error_code', 'state'].forEach((key) => callbackUrl.searchParams.delete(key));
          window.history.replaceState({}, document.title, callbackUrl.pathname + callbackUrl.search + callbackUrl.hash);
        } else if (authorizationCode) {
          try {
            // PKCE callback codes are exchanged by Supabase Auth, never decoded or trusted client-side.
            current = await authExchangeCodeForSession(authorizationCode);
            callbackUrl.searchParams.delete('code');
            callbackUrl.searchParams.delete('state');
            window.history.replaceState({}, document.title, callbackUrl.pathname + callbackUrl.search + callbackUrl.hash);
          } catch (error) {
            current = null;
            clearSession();
            clearOAuthPkceState();
            setAuthCallbackError(error instanceof Error ? error.message : 'OAuth sign-in failed. Please try again.');
            callbackUrl.searchParams.delete('code');
            callbackUrl.searchParams.delete('state');
            window.history.replaceState({}, document.title, callbackUrl.pathname + callbackUrl.search + callbackUrl.hash);
          }
        }

        if (window.location.hash.includes('type=recovery')) setIsPasswordRecovery(true);

        // Retain compatibility with Supabase recovery links that return tokens in the URL hash.
        if (window.location.hash.includes('access_token=')) {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const accessToken = hash.get('access_token');
          const refreshToken = hash.get('refresh_token');
          if (hash.get('type') === 'recovery') setIsPasswordRecovery(true);
          if (accessToken && refreshToken) {
            const authUserFromServer = await authGetUser(accessToken);
            current = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_in: Number(hash.get('expires_in') || 3600),
              expires_at: Math.floor(Date.now() / 1000) + Number(hash.get('expires_in') || 3600),
              token_type: hash.get('token_type') || 'bearer',
              user: authUserFromServer,
            };
            saveSession(current);
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }
        if (current && !current.refresh_token) {
          clearSession();
          current = null;
        }

        if (current?.refresh_token) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const expiresAt = current.expires_at ?? (nowSeconds + (current.expires_in || 3600));

          if (expiresAt <= nowSeconds + 60) {
            // Refresh before trusting an expiring token. A transient network outage must
            // not destroy a still-useful stored session, but a rejected refresh token must.
            try {
              current = await authRefresh(current);
            } catch (error) {
              if (isTransientAuthFailure(error) && expiresAt > nowSeconds) {
                console.warn('Could not refresh the session during startup; retaining it briefly while connectivity recovers.');
              } else {
                clearSession();
                current = null;
              }
            }
          } else {
            // A stored local session is only a cache. Verify it against Supabase Auth on
            // every app boot so deleted/revoked users are not treated as signed in.
            try {
              const verifiedUser = await authGetUser(current.access_token);
              current = { ...current, user: verifiedUser };
              saveSession(current);
            } catch (error) {
              const status = getSupabaseErrorStatus(error);
              if (status === 401 || status === 403) {
                try {
                  current = await authRefresh(current);
                } catch (refreshError) {
                  if (isTransientAuthFailure(refreshError)) {
                    console.warn('Supabase session validation is temporarily unavailable; retaining the unexpired session cache.');
                  } else {
                    clearSession();
                    current = null;
                  }
                }
              } else if (status !== undefined && status >= 400 && status < 500 && status !== 429) {
                clearSession();
                current = null;
              } else {
                // 429/5xx/network failure: retain the still-unexpired session but let
                // row-level security continue to enforce access on every data request.
                console.warn('Could not validate the session with Supabase right now; keeping the unexpired cache.');
              }
            }
          }
        }
        if (active) {
          setSession(current);
          setAuthUser(current?.user || null);
        }
      } catch (error) {
        console.warn('Supabase session restoration failed; please sign in again.', error);
        clearSession();
        if (active) {
          setSession(null);
          setAuthUser(null);
          if (window.location.search.includes('code=')) {
            setAuthCallbackError(error instanceof Error ? error.message : 'Unable to complete sign-in. Please try again.');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Keep account state consistent across browser tabs (for example, when a user signs out elsewhere).
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY && event.key !== null) return;
      const next = getSession();
      setSession(next);
      setAuthUser(next?.user || null);
      if (!next) setUser(null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    let active = true;
    void authGetEnabledOAuthProviders()
      .then((providers) => { if (active) setEnabledOAuthProviders(providers); })
      .catch((error) => {
        console.warn('Could not read enabled OAuth providers from Supabase Auth settings.', error);
        if (active) {
          setEnabledOAuthProviders([]);
          setOAuthProvidersError(error instanceof Error ? error.message : 'Could not load OAuth provider settings.');
        }
      })
      .finally(() => { if (active) setOAuthProvidersLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (session) void refreshProfile(session);
    else setUser(null);
    // Refresh customer profile when Supabase issues a new session/access token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  // Supabase issues rotating refresh tokens; renew shortly before expiry and persist only its response.
  useEffect(() => {
    if (!session?.refresh_token) return;
    const expiresAt = session.expires_at ?? (Math.floor(Date.now() / 1000) + (session.expires_in || 3600));
    const delay = Math.max(5_000, (expiresAt - 60) * 1000 - Date.now());
    const timer = window.setTimeout(async () => {
      try {
        const fresh = await authRefresh(session);
        setSession(fresh);
        setAuthUser(fresh.user);
      } catch (error) {
        if (isTransientAuthFailure(error)) {
          console.warn('Supabase session refresh failed temporarily; retrying shortly.');
          window.setTimeout(async () => {
            try {
              const latest = getSession();
              if (!latest?.refresh_token) return;
              const fresh = await authRefresh(latest);
              setSession(fresh);
              setAuthUser(fresh.user);
            } catch (retryError) {
              if (!isTransientAuthFailure(retryError) || isDefinitiveAuthFailure(retryError)) {
                clearSession();
                setSession(null);
                setAuthUser(null);
                setUser(null);
              }
            }
          }, 20_000);
          return;
        }
        console.warn('Supabase rejected the session refresh; signing out locally.', error);
        clearSession();
        setSession(null);
        setAuthUser(null);
        setUser(null);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session?.access_token]);

  const login = async (_name: string, _phone: string, email = '', password = '') => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('Enter your email address and password.');
    const authenticatedSession = await authPasswordSignIn(normalizedEmail, password);
    setSession(authenticatedSession);
    setAuthUser(authenticatedSession.user);
    await refreshProfile(authenticatedSession);
  };

  const signup = async (
    name: string,
    phone: string,
    email: string,
    password: string,
    city = '',
  ): Promise<'signed-in' | 'confirmation-required'> => {
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    if (trimmedName.length < 2) throw new Error('Enter your full name.');
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) throw new Error('Enter a valid 10-digit Indian mobile number.');
    if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
    const [firstName = '', ...lastNameParts] = trimmedName.split(' ');
    const result = await authSignUp(normalizedEmail, password, {
      full_name: trimmedName,
      first_name: firstName,
      last_name: lastNameParts.join(' '),
      phone: normalizedPhone,
      city: city.trim(),
    });

    if (!result.user) {
      throw new Error('Supabase Auth did not return the new user. Please try again.');
    }

    if (result.session) {
      setSession(result.session);
      setAuthUser(result.session.user);
      await refreshProfile(result.session);
      return 'signed-in';
    }

    // Email-confirmation mode is controlled in Supabase Dashboard. No app-side login is fabricated.
    setSession(null);
    setAuthUser(null);
    setUser(null);
    return 'confirmation-required';
  };

  const loginWithProvider = async (provider: AuthOAuthProviderName) => {
    // Only offer and launch providers currently enabled in this project's Supabase Auth config.
    if (!enabledOAuthProviders.some((item) => item.id === provider)) {
      throw new Error('This sign-in provider is not enabled in the current Supabase Auth configuration.');
    }
    const authorizationUrl = await authProviderUrl(provider, `${window.location.origin}/login`);
    window.location.assign(authorizationUrl);
  };

  const resetPassword = (email: string) => authResetPassword(email.trim(), `${window.location.origin}/login`);

  const updatePassword = async (password: string) => {
    if (!session?.access_token) throw new Error('Open the password-reset link from your email again before choosing a new password.');
    if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
    const updatedUser = await authUpdatePassword(password, session.access_token);
    setAuthUser(updatedUser);
    setSession((current) => current ? { ...current, user: updatedUser } : current);
    setIsPasswordRecovery(false);
  };

  const logout = async () => {
    const activeSession = session;
    // Clear the local UI/session immediately; still ask Supabase Auth to revoke
    // the server-side token using the captured token, even if the network fails.
    clearSession();
    setSession(null);
    setAuthUser(null);
    setUser(null);
    setIsPasswordRecovery(false);
    try {
      if (activeSession?.access_token) await authSignOut(activeSession.access_token);
    } catch (error) {
      // The browser is already signed out locally. Supabase may reject an expired token.
      console.warn('Supabase sign-out request did not complete; local session is cleared.', error);
    } finally {
      clearSession();
    }
  };

  const updateProfile = async (details: Partial<UserProfile>) => {
    if (!session?.user?.id) throw new Error('Please sign in first.');
    const rows = await dbSelect<any>('users', `select=id&auth_user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`, session.access_token);
    if (!rows[0]) throw new Error('Customer profile not found. Supabase Auth is active, but the linked customer profile is missing.');
    const body: any = {};
    if (details.name !== undefined) {
      body.full_name = details.name;
      const [first, ...rest] = details.name.trim().split(/\s+/);
      body.first_name = first || null;
      body.last_name = rest.join(' ') || null;
    }
    if (details.phone !== undefined) { body.phone = details.phone; body.phone_number = details.phone; }
    if (details.city !== undefined) body.city = details.city;
    if (details.address !== undefined) { body.street_address = details.address; body.address_line_1 = details.address; }
    if (details.district !== undefined) body.district = details.district;
    if (details.state !== undefined) body.state = details.state;
    if (details.pincode !== undefined) { body.pincode = details.pincode; body.postal_code = details.pincode; }
    const updated = await dbUpdate<any>('users', `id=eq.${rows[0].id}`, body, session.access_token);
    if (updated[0]) setUser(profileFromRow(updated[0], session.user));
  };

  return (
    <AuthContext.Provider value={{
      user,
      authUser,
      session,
      isAuthenticated: !!session,
      loading,
      isPasswordRecovery,
      enabledOAuthProviders,
      oauthProvidersLoading,
      oauthProvidersError,
      authCallbackError,
      clearAuthCallbackError: () => setAuthCallbackError(null),
      login,
      signup,
      loginWithProvider,
      resetPassword,
      updatePassword,
      logout,
      updateProfile,
      refreshProfile: () => refreshProfile(),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
