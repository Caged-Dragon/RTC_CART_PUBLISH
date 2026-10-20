const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');

async function loadShopNavigation() {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/utils/shopNavigation.ts'), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-shop-nav-'));
  const file = path.join(folder, 'shopNavigation.mjs');
  fs.writeFileSync(file, output);
  return { mod: await import(`${pathToFileURL(file).href}?test=${Date.now()}`), cleanup: () => fs.rmSync(folder, { recursive: true, force: true }) };
}

test('category shop URLs remain shareable and preserve unrelated query parameters', async (t) => {
  const { mod, cleanup } = await loadShopNavigation();
  t.after(cleanup);
  assert.equal(mod.buildCategorySearch('?q=sparklers&category=old', 'FLOWER POTS'), '?q=sparklers&category=FLOWER+POTS');
  assert.equal(mod.buildCategorySearch('?category=FLOWER+POTS&q=stars', 'All'), '?q=stars');
  assert.equal(mod.buildCategorySearch('', 'MULTIPLE & FANCY'), '?category=MULTIPLE+%26+FANCY');
  assert.equal(mod.buildCategorySearch('?category=old', ''), '');
});
