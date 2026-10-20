const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');

const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: { id: 'auth-user-test', email: 'shopper@example.test', user_metadata: { full_name: 'Test Shopper' } },
};

async function loadAuthModule() {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/supabase.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
    .replace(/const SUPABASE_URL = .*;\r?\n/, "const SUPABASE_URL = 'https://ypmiinmkyvzdpakbkers.supabase.co';\n")
    .replace(/const SUPABASE_KEY = .*;\r?\n/, "const SUPABASE_KEY = 'sb_publishable_test_public_key';\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-auth-test-'));
  const modulePath = path.join(tempDir, 'supabase.mjs');
  fs.writeFileSync(modulePath, transpiled);
  const module = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  return { module, cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true }) };
}

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
  };
}

test('Supabase Auth signup, password login, recovery, update and logout are server API calls', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;
  const storage = createStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'window', { value: { location: { origin: 'https://shop.example.test' } }, configurable: true, writable: true });
  try { Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true, writable: true }); } catch { /* Node may expose a read-only navigator. */ }

  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = { url: String(url), method: init.method || 'GET', headers: new Headers(init.headers || {}), body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    let payload = {};
    let status = 200;
    if (call.url.includes('/auth/v1/signup')) payload = { user: { id: 'auth-user-test', email: call.body.email }, session: null };
    else if (call.url.includes('/auth/v1/token?grant_type=password')) payload = structuredClone(mockSession);
    else if (call.url.includes('/auth/v1/token?grant_type=refresh_token')) payload = structuredClone(mockSession);
    else if (call.url.includes('/auth/v1/recover')) payload = {};
    else if (call.url.endsWith('/auth/v1/user')) payload = { id: 'auth-user-test', email: 'shopper@example.test' };
    else if (call.url.endsWith('/auth/v1/logout')) return new Response(null, { status: 204 });
    else if (call.url.endsWith('/auth/v1/user') && call.method === 'GET') payload = mockSession.user;
    else { status = 404; payload = { message: 'unexpected auth endpoint in test' }; }
    return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
  };

  const { module: auth, cleanup } = await loadAuthModule();
  t.after(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'localStorage', { value: originalStorage, configurable: true, writable: true });
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true });
    try { Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true, writable: true }); } catch { /* no-op */ }
  });

  const signup = await auth.authSignUp('shopper@example.test', 'example-password', { full_name: 'Test Shopper', city: 'Chennai' }, 'https://shop.example.test/login');
  assert.equal(signup.user.id, 'auth-user-test');
  assert.match(calls.at(-1).url, /\/auth\/v1\/signup\?redirect_to=/);
  assert.equal(calls.at(-1).body.password, 'example-password');
  assert.deepEqual(calls.at(-1).body.data, { full_name: 'Test Shopper', city: 'Chennai' });
  assert.equal(auth.getSession(), null, 'signup without a Supabase session must not fabricate a logged-in customer');

  const login = await auth.authPasswordSignIn('shopper@example.test', 'example-password');
  assert.equal(login.user.id, 'auth-user-test');
  assert.match(calls.at(-1).url, /\/auth\/v1\/token\?grant_type=password$/);
  assert.equal(auth.getSession().access_token, 'test-access-token');

  await auth.authResetPassword('shopper@example.test', 'https://shop.example.test/login');
  assert.match(calls.at(-1).url, /\/auth\/v1\/recover\?redirect_to=/);
  assert.deepEqual(calls.at(-1).body, { email: 'shopper@example.test' });

  const update = await auth.authUpdatePassword('another-example-password', 'test-access-token');
  assert.equal(update.id, 'auth-user-test');
  assert.equal(calls.at(-1).method, 'PUT');
  assert.equal(calls.at(-1).headers.get('Authorization'), 'Bearer test-access-token');
  assert.deepEqual(calls.at(-1).body, { password: 'another-example-password' });

  await auth.authSignOut('test-access-token');
  assert.match(calls.at(-1).url, /\/auth\/v1\/logout$/);
  assert.equal(calls.at(-1).headers.get('Authorization'), 'Bearer test-access-token');
  assert.equal(auth.getSession(), null, 'signout clears stored session after asking Supabase Auth to revoke it');
});

test('OAuth buttons follow enabled Supabase Auth providers and sign-in uses PKCE code exchange', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;
  const storage = createStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'window', { value: { location: { origin: 'https://shop.example.test' } }, configurable: true, writable: true });
  try { Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true, writable: true }); } catch { /* Node may expose a read-only navigator. */ }

  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = { url: String(url), method: init.method || 'GET', headers: new Headers(init.headers || {}), body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    let payload = {};
    if (call.url.endsWith('/auth/v1/settings')) {
      payload = { external: { google: true, apple: false, azure: true, github: true, email: true } };
    } else if (call.url.includes('/auth/v1/token?grant_type=pkce')) {
      payload = structuredClone(mockSession);
    } else {
      return new Response(JSON.stringify({ message: 'unexpected auth endpoint in OAuth test' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const { module: auth, cleanup } = await loadAuthModule();
  t.after(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'localStorage', { value: originalStorage, configurable: true, writable: true });
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true });
    try { Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true, writable: true }); } catch { /* no-op */ }
  });

  const providers = await auth.authGetEnabledOAuthProviders();
  assert.deepEqual(providers.map((provider) => provider.id), ['azure', 'github', 'google']);

  const authorizeUrl = new URL(await auth.authProviderUrl('google', 'https://shop.example.test/login'));
  assert.equal(authorizeUrl.searchParams.get('provider'), 'google');
  assert.equal(authorizeUrl.searchParams.get('redirect_to'), 'https://shop.example.test/login');
  assert.equal(authorizeUrl.searchParams.get('code_challenge_method'), 's256');
  assert.equal(authorizeUrl.searchParams.get('scopes'), 'openid email profile');
  assert.ok(authorizeUrl.searchParams.get('code_challenge'));
  const pkce = JSON.parse(storage.getItem('redthunder_supabase_oauth_pkce_v1'));
  assert.ok(pkce.verifier);
  assert.equal(pkce.provider, 'google');

  const facebookUrl = new URL(await auth.authProviderUrl('facebook', 'https://shop.example.test/login'));
  assert.equal(facebookUrl.searchParams.get('scopes'), 'email');
  const microsoftUrl = new URL(await auth.authProviderUrl('azure', 'https://shop.example.test/login'));
  assert.equal(microsoftUrl.searchParams.get('scopes'), 'email');
  // Restore Google's verifier before the exchange under test.
  storage.setItem('redthunder_supabase_oauth_pkce_v1', JSON.stringify(pkce));

  const session = await auth.authExchangeCodeForSession('test-authorization-code');
  assert.equal(session.user.id, 'auth-user-test');
  const exchange = calls.at(-1);
  assert.match(exchange.url, /\/auth\/v1\/token\?grant_type=pkce$/);
  assert.equal(exchange.body.auth_code, 'test-authorization-code');
  assert.equal(exchange.body.code_verifier, pkce.verifier);
  assert.equal(auth.getSession().access_token, 'test-access-token');
  assert.equal(storage.getItem('redthunder_supabase_oauth_pkce_v1'), null, 'verifier is cleared after successful exchange');
});

test('Auth HTTP errors expose status so expired/revoked sessions can be failed closed', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'localStorage', { value: createStorage(), configurable: true, writable: true });
  Object.defineProperty(globalThis, 'window', { value: { location: { origin: 'https://shop.example.test' } }, configurable: true, writable: true });
  try { Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true, writable: true }); } catch { /* no-op */ }
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 'bad_jwt', message: 'Invalid JWT' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  const { module: auth, cleanup } = await loadAuthModule();
  t.after(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'localStorage', { value: originalStorage, configurable: true, writable: true });
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true });
    try { Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true, writable: true }); } catch { /* no-op */ }
  });
  await assert.rejects(auth.authGetUser('expired-test-token'), (error) => {
    assert.equal(auth.getSupabaseErrorStatus(error), 401);
    assert.equal(error.status, 401);
    assert.match(error.message, /Invalid JWT/);
    return true;
  });
});
