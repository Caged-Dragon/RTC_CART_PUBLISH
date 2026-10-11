// Run: node tests/swr.test.cjs   (needs the `typescript` package that `npm ci` installs; no browser)
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ts = require('typescript');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'supabase.ts'), 'utf8');
const block = src.slice(src.indexOf('// ---- Stale-while-revalidate'), src.indexOf('export function clearSession()'));
const js = ts.transpileModule(block, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

function sandbox(dbSelect) {
  const store = new Map();
  const ls = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } };
  const ctx = { dbSelect, localStorage: ls, exports: {}, Date, JSON, Math, Map, Promise, Array, console };
  vm.runInNewContext(js + '\nexports.dbSelectSWR = dbSelectSWR;', ctx);
  return { swr: ctx.exports.dbSelectSWR, store };
}
const tick = () => new Promise(r => setTimeout(r, 0));

(async () => {
  // cold start: network only, one apply, then cached
  let calls = 0, rows = [{ id: 1 }];
  let { swr, store } = sandbox(async () => { calls++; return rows; });
  let seen = []; await swr('products', 'q', r => seen.push(JSON.stringify(r)));
  assert.deepStrictEqual(seen, ['[{"id":1}]']); assert.strictEqual(calls, 1); assert.ok([...store.keys()].some(k => k.startsWith('rt:swr:v1:products?q')));

  // warm start, unchanged data: cached copy applied once, network confirms, no second apply
  seen = []; await swr('products', 'q', r => seen.push(JSON.stringify(r)));
  assert.strictEqual(seen.length, 1); assert.strictEqual(calls, 2);

  // warm start, changed data: cached first, then fresh
  rows = [{ id: 1 }, { id: 2 }]; seen = []; await swr('products', 'q', r => seen.push(JSON.stringify(r)));
  assert.deepStrictEqual(seen, ['[{"id":1}]', '[{"id":1},{"id":2}]']);

  // freshMs: recent cache skips the network
  calls = 0; seen = []; await swr('products', 'q', r => seen.push(r.length), { freshMs: 60000 });
  assert.strictEqual(calls, 0); assert.deepStrictEqual(seen, [2]);

  // network down: cached copy is enough, no throw
  ({ swr } = (() => { const sb = sandbox(async () => { throw new Error('offline'); }); sb.store.set('rt:swr:v1:t?x', JSON.stringify({ at: Date.now(), rows: [{ a: 1 }] })); return sb; })());
  seen = []; await swr('t', 'x', r => seen.push(r.length)); assert.deepStrictEqual(seen, [1]);

  // network down and nothing cached: rejects so callers can show an error
  ({ swr } = sandbox(async () => { throw new Error('offline'); }));
  await assert.rejects(swr('t', 'x', () => assert.fail('must not apply')), /offline/);

  // expired cache (older than 24h) is ignored
  const sb = sandbox(async () => [{ fresh: true }]); sb.store.set('rt:swr:v1:t?x', JSON.stringify({ at: Date.now() - 25 * 3600e3, rows: [{ stale: true }] }));
  seen = []; await sb.swr('t', 'x', r => seen.push(JSON.stringify(r))); assert.deepStrictEqual(seen, ['[{"fresh":true}]']);

  // corrupt cache entry must not break loading
  const sb2 = sandbox(async () => [{ ok: 1 }]); sb2.store.set('rt:swr:v1:t?x', '{broken');
  seen = []; await sb2.swr('t', 'x', r => seen.push(r.length)); assert.deepStrictEqual(seen, [1]);

  // concurrent identical reads share one request
  calls = 0; ({ swr } = sandbox(async () => { calls++; await tick(); return [1]; }));
  await Promise.all([swr('a', 'q', () => {}), swr('a', 'q', () => {}), swr('a', 'q', () => {})]); assert.strictEqual(calls, 1);

  // oversized payloads are not cached
  const big = [{ blob: 'x'.repeat(450000) }]; const sb3 = sandbox(async () => big);
  await sb3.swr('big', 'q', () => {}); assert.strictEqual([...sb3.store.keys()].length, 0);
  console.log('CART SWR cache tests passed');
})().catch(e => { console.error(e); process.exit(1); });
