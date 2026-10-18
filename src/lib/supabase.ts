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
const SESSION_KEY = 'redthunder_supabase_session_v1';

export const supabaseConfig = { url: SUPABASE_URL, publishableKey: SUPABASE_KEY };

export function getSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSession(session: SupabaseSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
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
    res = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
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
      throw new Error('Incorrect email or password. Check your details, or use “Forgot password?” to reset your password.');
    }
    if (path.startsWith('/auth/v1/token?grant_type=password') && /email not confirmed/i.test(message)) {
      throw new Error('Please verify your email address before signing in.');
    }
    if (res.status === 429) {
      throw new Error('Too many attempts. Please wait a moment and try again.');
    }
    if (res.status === 503 || res.status === 504) {
      throw new Error('The service is temporarily unavailable. Check your connection and try again.');
    }
    throw new Error(message || `Supabase request failed (${res.status}).`);
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

export async function authPasswordSignIn(email: string, password: string): Promise<SupabaseSession> {
  const session = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
  saveSession(session);
  return session;
}

export async function authSignUp(email: string, password: string, metadata: Record<string, any> = {}): Promise<{ session: SupabaseSession | null; user: SupabaseAuthUser | null }> {
  const data = await request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password, data: metadata }) });
  if (data?.session) saveSession(data.session);
  return data;
}

export async function authRefresh(session: SupabaseSession): Promise<SupabaseSession> {
  const data = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
  saveSession(data);
  return data;
}

export async function authResetPassword(email: string) {
  await request('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) });
}

export function authProviderUrl(provider: 'google' | 'apple' | 'azure', redirectTo = window.location.origin) {
  return `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
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
