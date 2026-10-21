const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('storefront build generates crawlable per-route HTML metadata after Vite build', () => {
  const pkg = JSON.parse(read('package.json'));
  const prerender = read('scripts/prerender-seo.mjs');
  assert.match(pkg.scripts.build, /vite build && node scripts\/prerender-seo\.mjs/);
  for (const token of ['<title>', 'canonical', 'og:title', 'twitter:title', 'robots', 'rt-prerendered-page-schema']) {
    assert.ok(prerender.includes(token), `prerender should generate ${token}`);
  }
  assert.match(prerender, /'@type': 'Product'/);
  assert.match(prerender, /pathName: page\.path/);
  assert.match(prerender, /pathName: `\/product\/\$\{serial\}`/);
  assert.match(prerender, /indexable: true, image: product\?\.image/);
  assert.doesNotMatch(prerender, /'@type': 'AggregateOffer'|'offers':\s*\{/);
});

test('all public informational routes receive a page-level SEO definition and private surfaces stay noindex', () => {
  const prerender = read('scripts/prerender-seo.mjs');
  for (const route of ['/', '/products', '/categories', '/best-sellers', '/price-list', '/transport', '/safety', '/about', '/contact']) {
    assert.ok(prerender.includes(`path: '${route}'`), `missing SEO definition for ${route}`);
  }
  for (const route of ['/cart', '/my-orders', '/track-order', '/login', '/whatsapp-order', '/email-bill', '/combos', '/gift-boxes', '/reviews']) {
    const fragment = prerender.split(`path: '${route}'`)[1]?.split('\n  { path:')[0] || '';
    assert.match(fragment, /indexable:\s*false/ , `private or unverified route ${route} must stay noindex`);
  }
});

test('legacy checkout URLs redirect to the product catalogue instead of a stale online checkout', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const redirects = new Map((vercel.redirects || []).map((entry) => [entry.source, entry.destination]));
  assert.equal(redirects.get('/checkout'), '/products');
  assert.equal(redirects.get('/confirmation'), '/products');
  assert.equal(redirects.get('/orders'), '/my-orders');
  assert.equal(redirects.get('/order'), '/my-orders');
});

test('active fallbacks and database smoke checks no longer point at the retired Supabase project/schema', () => {
  const files = ['src/screens/AuthScreen.tsx', 'src/lib/email.ts', 'scripts/check-supabase-homepage.mjs'];
  for (const file of files) {
    const content = read(file);
    assert.doesNotMatch(content, /ypmiinmkyvzdpakbkers/);
    assert.match(content, /hhbpyxhtksgbkaigeutl/);
  }
  const smoke = read('scripts/check-supabase-homepage.mjs');
  for (const table of ['products', 'product_prices', 'product_categories', 'web_seo', 'app_sites']) assert.ok(smoke.includes(table));
  assert.doesNotMatch(smoke, /homepage_customer_picks|company_profile|merchant_settings|theme_page_settings/);
});
