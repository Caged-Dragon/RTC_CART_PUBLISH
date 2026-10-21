const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const readShowcase = (file) => {
  const sibling = path.resolve(process.cwd(), '../showcase', file);
  const fallback = path.resolve(process.cwd(), 'tests/fixtures/showcase', file);
  return fs.readFileSync(fs.existsSync(sibling) ? sibling : fallback, 'utf8');
};

test('storefront cannot create an online firework order through its app context', () => {
  const context = read('src/context/CartContext.tsx');
  assert.match(context, /does not accept online fireworks orders/);
  assert.doesNotMatch(context, /rpc\(['"]create_order['"]/);
});

test('cross-site legacy order payloads only navigate to catalogue search and never auto-add', () => {
  const app = read('src/App.tsx');
  assert.match(app, /Legacy showcase query parameters are treated as catalogue search hints only/);
  assert.doesNotMatch(app.slice(app.indexOf('Legacy showcase query parameters'), app.indexOf('const product = selectedProductId')), /addToCart\(/);
  const util = readShowcase('src/lib/utils.ts');
  assert.doesNotMatch(util, /CART_URL}\/add/);
});

test('website provides enquiry routes instead of a checkout submit button', () => {
  const screen = read('src/screens/CartPageScreen.tsx');
  assert.match(screen, /Your Enquiry List/);
  assert.match(screen, /does not accept online fireworks orders/);
  assert.doesNotMatch(screen, /Place COD Order|type="submit"/);
});

test('CMS-managed banner buttons cannot route to third-party or transactional URLs', () => {
  const navigation = read('src/utils/navigationTarget.ts');
  assert.match(navigation, /isOwnedCatalogue/);
  assert.match(navigation, /looksTransactional/);
  assert.match(navigation, /rtcrackers\.com/);
});

test('WhatsApp helper creates only a general product-information message', () => {
  const helper = read('src/utils/whatsapp.ts');
  assert.match(helper, /general question about the published product catalogue/);
  assert.doesNotMatch(helper, /orderId|customer\.address|customer\.phone|ORDER ITEMS|Subtotal/i);
});
