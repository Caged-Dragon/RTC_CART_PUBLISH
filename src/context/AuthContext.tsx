import React, { createContext, useContext, useEffect, useState } from 'react';
import { authDeleteOwnAccount, authGetUser, authProviderUrl, authRefresh, authResetPassword, authSendOtp, authUpdateUser, authVerifyOtp, clearSession, dbSelect, dbUpdate, getSession, SupabaseAuthUser, SupabaseSession } from '../lib/supabase';

export interface UserProfile { id?: string; authUserId?: string; name: string; phone: string; email: string; city?: string; address?: string; district?: string; state?: string; pincode?: string; }
interface AuthContextType { user: UserProfile | null; authUser: SupabaseAuthUser | null; session: SupabaseSession | null; isAuthenticated: boolean; loading: boolean; login: (name: string, phone: string, email?: string, password?: string) => Promise<void>; signup: (name: string, phone: string, email: string, password?: string) => Promise<void>; sendEmailOtp: (email: string, createUser?: boolean, metadata?: Record<string, any>) => Promise<void>; verifyEmailOtp: (email: string, token: string) => Promise<void>; updatePreferences: (preferences: Record<string, boolean>) => Promise<void>; deleteAccount: () => Promise<void>; loginWithProvider: (provider: 'google'|'apple'|'azure') => void; resetPassword: (email: string) => Promise<void>; logout: () => void; updateProfile: (details: Partial<UserProfile>) => Promise<void>; refreshProfile: () => Promise<void>; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileFromRow(row: any, authUser?: SupabaseAuthUser | null): UserProfile {
  return { id: row?.id, authUserId: row?.auth_user_id || authUser?.id, name: row?.full_name || [row?.first_name, row?.last_name].filter(Boolean).join(' ') || authUser?.user_metadata?.full_name || '', phone: row?.phone_number || row?.phone || authUser?.phone || '', email: row?.email || authUser?.email || '', city: row?.city, address: row?.street_address || row?.address_line_1, district: row?.district, state: row?.state, pincode: row?.pincode || row?.postal_code };
}

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [session, setSession] = useState<SupabaseSession | null>(getSession());
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(getSession()?.user || null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!session?.user?.id) { setUser(null); return; }
    try {
      const rows = await dbSelect<any>('users', `select=*&auth_user_id=eq.${session.user.id}&limit=1`, session.access_token);
      if (rows[0]) setUser(profileFromRow(rows[0], session.user));
      else setUser({ authUserId: session.user.id, name: String(session.user.user_metadata?.full_name || ''), phone: String(session.user.user_metadata?.phone || ''), email: session.user.email || '' });
    } catch (e) {
      console.error('Profile load failed', e);
      setUser({ authUserId: session.user.id, name: String(session.user.user_metadata?.full_name || ''), phone: String(session.user.user_metadata?.phone || ''), email: session.user.email || '' });
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let s = getSession();
        if (!s && window.location.hash.includes('access_token=')) {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const access_token = hash.get('access_token');
          const refresh_token = hash.get('refresh_token');
          if (access_token && refresh_token) {
            const u = await authGetUser(access_token);
            s = { access_token, refresh_token, expires_in: Number(hash.get('expires_in') || 3600), expires_at: Math.floor(Date.now()/1000) + Number(hash.get('expires_in') || 3600), token_type: hash.get('token_type') || 'bearer', user: u };
            localStorage.setItem('redthunder_supabase_session_v1', JSON.stringify(s));
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }
        if (s?.refresh_token && s.expires_at && s.expires_at < Date.now()/1000 + 60) s = await authRefresh(s);
        if (active) { setSession(s); setAuthUser(s?.user || null); }
      } catch { clearSession(); if (active) { setSession(null); setAuthUser(null); } }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (session) refreshProfile(); else setUser(null); }, [session?.access_token]);

  // Silently renew the access token a minute before it expires, so order history, reviews and
  // profile calls keep working in long sessions instead of failing with 401 after ~1 hour.
  useEffect(() => {
    if (!session?.refresh_token) return;
    const expiresAt = session.expires_at ?? (Math.floor(Date.now() / 1000) + (session.expires_in || 3600));
    const delay = Math.max(5_000, (expiresAt - 60) * 1000 - Date.now());
    const timer = window.setTimeout(async () => {
      try { const fresh = await authRefresh(session); setSession(fresh); setAuthUser(fresh.user); }
      catch { clearSession(); setSession(null); setAuthUser(null); setUser(null); }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session?.access_token]);

  const login = async (_name: string, _phone: string, email = '', _password = '') => {
    if (!email.trim()) throw new Error('Enter your email address.');
    await authSendOtp(email, false);
  };
  const signup = async (name: string, phone: string, email: string, _password = '') => {
    if (!name.trim() || !email.trim()) throw new Error('Name and email are required.');
    await authSendOtp(email, true, { full_name: name.trim(), phone: phone.trim() });
  };
  const sendEmailOtp = async (email: string, createUser = false, metadata: Record<string, any> = {}) => {
    await authSendOtp(email, createUser, metadata);
  };
  const verifyEmailOtp = async (email: string, token: string) => {
    // The app sends both registration and sign-in codes via /auth/v1/otp.
    // Supabase's email OTP verification flow uses type 'email' for both.
    const fresh = await authVerifyOtp(email, token, 'email');
    setSession(fresh); setAuthUser(fresh.user);
    // Refresh once the new session is installed; avoid using a stale closure session.
    const rows = await dbSelect<any>('users', `select=*&auth_user_id=eq.${fresh.user.id}&limit=1`, fresh.access_token).catch(() => []);
    if (rows[0]) setUser(profileFromRow(rows[0], fresh.user));
    else setUser({ authUserId: fresh.user.id, name: String(fresh.user.user_metadata?.full_name || ''), phone: String(fresh.user.user_metadata?.phone || ''), email: fresh.user.email || email });
  };
  const updatePreferences = async (preferences: Record<string, boolean>) => {
    if (!session?.access_token) throw new Error('Please sign in first.');
    const updated = await authUpdateUser(session.access_token, { ...(authUser?.user_metadata || {}), preferences });
    setAuthUser(updated as SupabaseAuthUser);
    const next = { ...session, user: updated as SupabaseAuthUser };
    setSession(next);
    localStorage.setItem('redthunder_supabase_session_v1', JSON.stringify(next));
  };
  const deleteAccount = async () => {
    if (!session?.access_token) throw new Error('Please sign in first.');
    await authDeleteOwnAccount(session.access_token);
    clearSession(); setSession(null); setAuthUser(null); setUser(null);
  };
  const loginWithProvider = (provider: 'google'|'apple'|'azure') => { window.location.href = authProviderUrl(provider); };
  const resetPassword = (email: string) => authResetPassword(email.trim());
  const logout = () => { clearSession(); setSession(null); setAuthUser(null); setUser(null); };
  const updateProfile = async (details: Partial<UserProfile>) => {
    if (!session?.user?.id) throw new Error('Please sign in first.');
    const rows = await dbSelect<any>('users', `select=id&auth_user_id=eq.${session.user.id}&limit=1`, session.access_token);
    if (!rows[0]) throw new Error('Customer profile not found.');
    const body: any = {};
    if (details.name !== undefined) { body.full_name = details.name; const [f,...rest]=details.name.trim().split(/\s+/); body.first_name=f||null; body.last_name=rest.join(' ')||null; }
    if (details.phone !== undefined) { body.phone = details.phone; body.phone_number = details.phone; }
    if (details.city !== undefined) body.city = details.city;
    if (details.address !== undefined) { body.street_address = details.address; body.address_line_1 = details.address; }
    if (details.district !== undefined) body.district = details.district;
    if (details.state !== undefined) body.state = details.state;
    if (details.pincode !== undefined) { body.pincode = details.pincode; body.postal_code = details.pincode; }
    const updated = await dbUpdate<any>('users', `id=eq.${rows[0].id}`, body, session.access_token);
    if (updated[0]) setUser(profileFromRow(updated[0], session.user));
  };

  return <AuthContext.Provider value={{user, authUser, session, isAuthenticated: !!session, loading, login, signup, sendEmailOtp, verifyEmailOtp, updatePreferences, deleteAccount, loginWithProvider, resetPassword, logout, updateProfile, refreshProfile}}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const c=useContext(AuthContext); if(!c) throw new Error('useAuth must be used within AuthProvider'); return c; };
