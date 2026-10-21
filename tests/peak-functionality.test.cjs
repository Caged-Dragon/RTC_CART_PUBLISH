const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('home page links directly to all non-home customer screens without a budget-to-combo section', () => {
  const home = read('src/screens/IntroScreen.tsx');
  const nav = read('src/components/Navbar.tsx');
  const mobile = read('src/components/MobileBottomNav.tsx');
  const footer = read('src/components/Footer.tsx');
  const expectedTargets = [
    "screen: 'products'", "screen: 'categories'", "screen: 'bestsellers'", "screen: 'table'",
    "screen: 'combos'", "screen: 'gift-boxes'", "screen: 'cart'", "screen: 'myorders'",
    "screen: 'tracker'", "screen: 'whatsapp'", "screen: 'mail'", "screen: 'auth'",
    "screen: 'transport'", "screen: 'safety'", "screen: 'reviews'", "screen: 'about'", "screen: 'contact'",
  ];
  for (const target of expectedTargets) assert.ok(home.includes(target), `home directory is missing ${target}`);
  assert.doesNotMatch(home, /Shop by Budget/);
  assert.match(home, /className="rt-service-strip"/);
  assert.match(home, /onClick=\{\(\) => onNavigate\('transport'\)\}/);
  assert.match(home, /onClick=\{\(\) => onNavigate\('cart'\)\}/);
  assert.match(home, /onClick=\{\(\) => onNavigate\('whatsapp'\)\}/);
  assert.match(nav, /currentScreen === 'intro' \? primaryNav : primaryNav\.filter\(\(item\) => item\.id !== 'intro'\)/);
  assert.match(nav, /currentScreen === 'intro' \? \(/);
  assert.match(mobile, /currentScreen === 'intro'/);
  assert.match(footer, /currentScreen === 'intro' && <button onClick=\{\(\) => window\.scrollTo/);
});

test('catalogue has cumulative budget filters and reflects them in the URL', () => {
  const products = read('src/screens/ProductsScreen.tsx');
  assert.match(products, /id: 'u500', label: 'Up to ₹500', min: 0, max: 500/);
  assert.match(products, /id: 'u1000', label: 'Up to ₹1,000', min: 0, max: 1000/);
  assert.match(products, /id: 'u1500', label: 'Up to ₹1,500', min: 0, max: 1500/);
  assert.match(products, /params\.set\('budget', priceBand\)/);
  assert.match(products, /refreshProducts/);
  assert.match(products, /No products found/);
  assert.match(products, /const closeDetail = \(\) => \{/);
  assert.match(products, /if \(selectedCategory !== 'All'\) params\.set\('category', selectedCategory\)/);
  assert.match(products, /if \(priceBand !== 'all'\) params\.set\('budget', priceBand\)/);
  assert.match(products, /if \(search\.trim\(\)\) params\.set\('q', search\.trim\(\)\)/);
  const navbar = read('src/components/Navbar.tsx');
  assert.match(navbar, /setShopIntent\(\{ type: 'all' \}\);\s*setShopIntent\(\{ type: 'search', value \}\)/);
  assert.match(navbar, /url\.searchParams\.delete\('category'\);\s*url\.searchParams\.delete\('budget'\)/);
});

test('order tracking uses the selected real order and has no hard-coded sample order', () => {
  const app = read('src/App.tsx');
  const orders = read('src/screens/MyOrdersScreen.tsx');
  const tracker = read('src/screens/TrackerScreen.tsx');
  assert.match(orders, /onSelectTrackingId\(orderId, selectedOrder\?\.guestTrackingToken\)/);
  assert.match(app, /initialOrderId=\{selectedTrackingOrder\?\.id\}/);
  assert.match(app, /initialTrackingToken=\{selectedTrackingOrder\?\.token\}/);
  assert.match(tracker, /onSubmit=\{\(event\) => \{ event\.preventDefault\(\); void fetchOrder\(searchId, trackingToken\); \}\}/);
  assert.match(tracker, /get_guest_order/);
  assert.doesNotMatch(tracker, /RT-2026-1088/);
  assert.match(tracker, /trackingStepState\(stepIndex, order\.status\)/);
  assert.match(tracker, /orderIsCancelled/);
});

test('homepage fade effects degrade safely when intersection observers are unavailable', () => {
  const home = read('src/screens/IntroScreen.tsx');
  const css = read('src/index.css');
  assert.match(home, /typeof IntersectionObserver === 'undefined' \|\| window\.matchMedia/);
  assert.match(home, /sections\.forEach\(\(section\) => section\.classList\.add\('is-visible'\)\)/);
  assert.match(css, /\.rt-home > \.rt-home-reveal\.is-visible \{ opacity: 1; transform: translateY\(0\); \}/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
