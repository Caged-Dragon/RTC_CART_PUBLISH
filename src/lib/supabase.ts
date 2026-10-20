export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type?: string;
  user: SupabaseAuthUser;
};

export type SupabaseAuthUser = {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, any>;
  identities?: Array<{ id: string; provider?: string }> | null;
};

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://ypmiinmkyvzdpakbkers.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const SESSION_STORAGE_KEY = 'redthunder_supabase_session_v1';

export const supabaseConfig = { url: SUPABASE_URL, publishableKey: SUPABASE_KEY };

export function getSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSession(session: SupabaseSession | null) {
  if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_STORAGE_KEY);
}

type SupabaseRequestError = Error & { status?: number; code?: string };
function requestError(message: string, status: number, code = ''): SupabaseRequestError {
  const error = new Error(message) as SupabaseRequestError;
  error.status = status;
  error.code = code;
  return error;
}

export function getSupabaseErrorStatus(error: unknown): number | undefined {
  const status = (error as SupabaseRequestError | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

async function request(path: string, init: RequestInit = {}, accessToken?: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY || /^your_supabase_publishable_key$/i.test(SUPABASE_KEY)) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then rebuild the app.');
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('You appear to be offline. Reconnect to the internet and try again.');
  }

  const headers = new Headers(init.headers || {});
  headers.set('apikey', SUPABASE_KEY);
  headers.set('Content-Type', 'application/json');

  // New Supabase publishable keys are opaque keys, not JWTs. Send them via
  // `apikey` only; Authorization is reserved for a user's access token. Keep
  // compatibility with legacy anon keys, which are JWTs beginning with `eyJ`.
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else if (SUPABASE_KEY.startsWith('eyJ')) {
    headers.set('Authorization', `Bearer ${SUPABASE_KEY}`);
  } else {
    headers.delete('Authorization');
  }

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}${path}`, { ...init, ...(path.startsWith('/auth/v1/') ? { cache: 'no-store' as RequestCache } : {}), headers });
  } catch {
    throw new Error('Could not reach Supabase. Check your internet connection and try again.');
  }

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const code = String(data?.code || data?.error_code || '').toLowerCase();
    const message = String(data?.message || data?.msg || data?.error_description || data?.error || '');
    if (path.startsWith('/auth/v1/token?grant_type=password') && res.status === 400 &&
        (code === 'invalid_credentials' || /invalid login credentials/i.test(message))) {
      throw requestError('Incorrect email or password. Check your details, or use “Forgot password?” to reset your password.', res.status, code);
    }
    if (path.startsWith('/auth/v1/token?grant_type=password') && /email not confirmed/i.test(message)) {
      throw requestError('Please verify your email address before signing in.', res.status, code);
    }
    if (path.startsWith('/auth/v1/signup') && /password should be at least|weak password|password is too short/i.test(message)) {
      throw requestError('Choose a stronger password that meets the password requirements shown by Supabase Auth.', res.status, code);
    }
    if (path.startsWith('/auth/v1/signup') && /invalid email|email address is invalid/i.test(message)) {
      throw requestError('Enter a valid email address and try again.', res.status, code);
    }
    if (path.startsWith('/auth/v1/user') && /password should be at least|weak password|password is too short/i.test(message)) {
      throw requestError('Choose a stronger password that meets the password requirements configured in Supabase Auth.', res.status, code);
    }
    if (res.status === 429) {
      throw requestError('Too many attempts. Please wait a moment and try again.', res.status, code);
    }
    if (res.status === 503 || res.status === 504) {
      throw requestError('The service is temporarily unavailable. Check your connection and try again.', res.status, code);
    }
    throw requestError(message || `Supabase request failed (${res.status}).`, res.status, code);
  }
  return data;
}

export async function dbSelect<T = any>(table: string, query: string, accessToken?: string): Promise<T[]> {
  return request(`/rest/v1/${table}?${query}`, { method: 'GET' }, accessToken);
}

export async function dbInsert<T = any>(table: string, body: any, accessToken?: string): Promise<T[]> {
  return request(`/rest/v1/${table}`, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) }, accessToken);
}

export async function dbUpdate<T = any>(table: string, query: string, body: any, accessToken: string): Promise<T[]> {
  return request(`/rest/v1/${table}?${query}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) }, accessToken);
}

export async function dbDelete<T = any>(table: string, query: string, accessToken: string): Promise<T[]> {
  return request(`/rest/v1/${table}?${query}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } }, accessToken);
}

export async function rpc<T = any>(fn: string, body: any, accessToken?: string): Promise<T> {
  return request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(body) }, accessToken);
}


export async function authGetUser(accessToken: string): Promise<SupabaseAuthUser> {
  return request('/auth/v1/user', { method: 'GET' }, accessToken);
}

/**
 * Customer identity, password validation, email confirmation, and token issuance are
 * handled by Supabase Auth (GoTrue). This browser app never stores password hashes
 * or validates a password against public.users. The public.users row is a profile
 * linked by the database's on_auth_user_created trigger.
 */
export async function authPasswordSignIn(email: string, password: string): Promise<SupabaseSession> {
  const session = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
    throw new Error('Supabase Auth did not return a complete session. Please try again.');
  }
  saveSession(session);
  return session;
}

export async function authSignUp(
  email: string,
  password: string,
  metadata: Record<string, any> = {},
  redirectTo = `${window.location.origin}/login`,
): Promise<{ session: SupabaseSession | null; user: SupabaseAuthUser | null }> {
  const data = await request(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password, data: metadata }),
  });
  // The Supabase dashboard's Confirm email setting determines whether signup
  // returns a session or a pending user. Do not fabricate a local authenticated state.
  if (data?.session) saveSession(data.session);
  else saveSession(null);
  return { session: data?.session || null, user: data?.user || null };
}

export async function authRefresh(session: SupabaseSession): Promise<SupabaseSession> {
  const data = await request('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!data?.access_token || !data?.refresh_token || !data?.user?.id) {
    throw new Error('Supabase could not refresh this session. Please sign in again.');
  }
  saveSession(data);
  return data;
}

export async function authSignOut(accessToken: string): Promise<void> {
  try {
    // Revoke the Supabase Auth session server-side, then clear the local token copy.
    await request('/auth/v1/logout', { method: 'POST' }, accessToken);
  } finally {
    clearSession();
  }
}

export async function authResetPassword(email: string, redirectTo = `${window.location.origin}/login`) {
  await request(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function authUpdatePassword(password: string, accessToken: string): Promise<SupabaseAuthUser> {
  return request('/auth/v1/user', {
    method: 'PUT',
    body: JSON.stringify({ password }),
  }, accessToken);
}

export const OAUTH_PROVIDER_LABELS = {
  apple: 'Apple',
  azure: 'Microsoft',
  bitbucket: 'Bitbucket',
  discord: 'Discord',
  facebook: 'Facebook',
  figma: 'Figma',
  github: 'GitHub',
  gitlab: 'GitLab',
  google: 'Google',
  kakao: 'Kakao',
  keycloak: 'Keycloak',
  linkedin: 'LinkedIn',
  linkedin_oidc: 'LinkedIn',
  notion: 'Notion',
  slack: 'Slack',
  slack_oidc: 'Slack',
  spotify: 'Spotify',
  twitch: 'Twitch',
  twitter: 'X / Twitter',
  workos: 'WorkOS',
  zoom: 'Zoom',
} as const;

export type AuthOAuthProviderName = keyof typeof OAUTH_PROVIDER_LABELS;
export type EnabledOAuthProvider = { id: AuthOAuthProviderName; label: string };
const OAUTH_PKCE_KEY = 'redthunder_supabase_oauth_pkce_v1';
const OAUTH_PKCE_MAX_AGE_MS = 15 * 60 * 1000;

/**
 * The built-in social-provider switches live in Supabase Auth configuration,
 * not in public application tables. The public Auth settings endpoint exposes
 * which external providers are enabled without exposing client secrets.
 */
export async function authGetEnabledOAuthProviders(): Promise<EnabledOAuthProvider[]> {
  const settings = await request('/auth/v1/settings', { method: 'GET' });
  const external = settings?.external || settings?.external_providers || {};
  const flags = Array.isArray(external)
    ? Object.fromEntries(external.map((name: unknown) => [String(name), true]))
    : external;

  return (Object.keys(OAUTH_PROVIDER_LABELS) as AuthOAuthProviderName[])
    .filter((id) => flags?.[id] === true || flags?.[id]?.enabled === true || flags?.[id] === 'true')
    .map((id) => ({ id, label: OAUTH_PROVIDER_LABELS[id] }));
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function clearOAuthPkceState() {
  try { localStorage.removeItem(OAUTH_PKCE_KEY); } catch { /* storage is best effort */ }
}

/** Start Supabase's standard OAuth authorization-code flow with PKCE. */
export async function authProviderUrl(provider: AuthOAuthProviderName, redirectTo = `${window.location.origin}/login`) {
  if (!Object.prototype.hasOwnProperty.call(OAUTH_PROVIDER_LABELS, provider)) {
    throw new Error('That sign-in provider is not supported by this application.');
  }
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
    throw new Error('Secure OAuth sign-in requires a modern browser on HTTPS or localhost.');
  }

  const random = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64Url(random);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64Url(new Uint8Array(digest));
  localStorage.setItem(OAUTH_PKCE_KEY, JSON.stringify({ verifier, provider, createdAt: Date.now() }));

  const url = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  url.searchParams.set('provider', provider);
  url.searchParams.set('redirect_to', redirectTo);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 's256');
  return url.toString();
}

/** Exchange the one-time callback code for a session using its local PKCE verifier. */
export async function authExchangeCodeForSession(code: string): Promise<SupabaseSession> {
  let stored: { verifier?: string; createdAt?: number } | null = null;
  try {
    const raw = localStorage.getItem(OAUTH_PKCE_KEY);
    stored = raw ? JSON.parse(raw) : null;
  } catch { stored = null; }

  if (!stored?.verifier || !stored.createdAt || Date.now() - stored.createdAt > OAUTH_PKCE_MAX_AGE_MS) {
    clearOAuthPkceState();
    throw new Error('Your sign-in link has expired or its secure verification state is missing. Please start sign-in again.');
  }
  if (!code) throw new Error('Supabase did not return an OAuth authorization code.');

  try {
    const session = await request('/auth/v1/token?grant_type=pkce', {
      method: 'POST',
      body: JSON.stringify({ auth_code: code, code_verifier: stored.verifier }),
    });
    if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
      throw new Error('Supabase Auth did not return a complete OAuth session. Please try again.');
    }
    saveSession(session);
    clearOAuthPkceState();
    return session as SupabaseSession;
  } catch (error) {
    clearOAuthPkceState();
    throw error;
  }
}

// ---- Stale-while-revalidate reads of PUBLIC data (catalogue, offers, theme, company) ----------------
// Returning visitors see the last copy instantly while fresh data loads in the background; identical
// requests made at the same moment share one network call. Never used for signed-in/private data.
const SWR_PREFIX = 'rt:swr:v1:';
const SWR_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SWR_MAX_BYTES = 400_000;
const swrInflight = new Map<string, Promise<any[]>>();

function swrRead<T>(key: string): { rows: T[]; at: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return Array.isArray(v?.rows) && typeof v.at === 'number' ? v : null;
  } catch { return null; }
}

function swrWrite(key: string, rows: unknown[], serialized: string) {
  if (serialized.length > SWR_MAX_BYTES) return;
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), rows }));
    if (Math.random() < 0.05) { // occasional tidy-up of old entries
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(SWR_PREFIX)) { const e = swrRead(k); if (!e || Date.now() - e.at > SWR_MAX_AGE_MS) localStorage.removeItem(k); }
      }
    }
  } catch { /* storage full or unavailable: caching is optional */ }
}

/**
 * Reads public rows. `apply` is called with the cached copy immediately (if any) and again with fresh rows
 * only when they differ. `freshMs` skips the network entirely when the cached copy is that recent.
 * Rejects only when the network fails and nothing was cached.
 */
export async function dbSelectSWR<T = any>(table: string, query: string, apply: (rows: T[]) => void, opts: { freshMs?: number } = {}): Promise<void> {
  const key = `${SWR_PREFIX}${table}?${query}`;
  const cached = swrRead<T>(key);
  let applied = false;
  if (cached && Date.now() - cached.at < SWR_MAX_AGE_MS) {
    apply(cached.rows); applied = true;
    if (opts.freshMs && Date.now() - cached.at < opts.freshMs) return;
  }
  try {
    let pending = swrInflight.get(key) as Promise<T[]> | undefined;
    if (!pending) {
      pending = dbSelect<T>(table, query).finally(() => swrInflight.delete(key));
      swrInflight.set(key, pending);
    }
    const rows = await pending;
    const serialized = JSON.stringify(rows);
    if (!cached || JSON.stringify(cached.rows) !== serialized) apply(rows);
    swrWrite(key, rows, serialized);
  } catch (error) {
    if (!applied) throw error;
  }
}

export function clearSession() { saveSession(null); }

export function getStoredSupabaseConfig() { return { url: SUPABASE_URL, anonKey: SUPABASE_KEY }; }
export function saveSupabaseConfig() { /* configuration is build-time via Vite env */ }
export function clearSupabaseConfig() { /* configuration is build-time via Vite env */ }
export function getSupabaseClient() { return null; }
export async function testSupabaseConnection() {
  try { await dbSelect('products', 'select=id&limit=1'); return { success: true, message: 'Connected to Supabase.' }; }
  catch (e: any) { return { success: false, message: e.message || 'Connection failed.' }; }
}

export const SUPABASE_SQL_SETUP_SCRIPT = '';
