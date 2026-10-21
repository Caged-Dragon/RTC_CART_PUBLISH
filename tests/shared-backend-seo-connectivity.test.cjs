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

test('showcase and storefront target the same verified Supabase project', () => {
  const storeEnv = read('.env.example');
  const supabaseClient = read('src/lib/supabase.ts');
  assert.match(storeEnv, /VITE_SUPABASE_URL=https:\/\/hhbpyxhtksgbkaigeutl\.supabase\.co/);
  assert.match(storeEnv, /VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_/);
  assert.match(supabaseClient, /https:\/\/hhbpyxhtksgbkaigeutl\.supabase\.co/);
  const showcaseEnv = readShowcase('.env.example');
  assert.match(showcaseEnv, /NEXT_PUBLIC_SUPABASE_URL=https:\/\/hhbpyxhtksgbkaigeutl\.supabase\.co/);
});

test('catalogue reads the normalized shared schema rather than retired table names', () => {
  const storeProducts = read('src/context/ProductsContext.tsx');
  const showcaseCms = readShowcase('src/lib/cms.ts');
  for (const table of ['products', 'product_prices', 'product_categories', 'product_pack_types', 'product_images']) {
    assert.match(storeProducts, new RegExp(`(?:dbSelect|optional)<any>\\('${table}'`));
    assert.match(showcaseCms, new RegExp(`from\\("${table}"\\)`));
  }
  assert.match(storeProducts, /is_current=eq\.true/);
  assert.match(storeProducts, /source_serial_no/);
  assert.doesNotMatch(storeProducts, /homepage_customer_picks|from\('users'\)/);
  assert.doesNotMatch(showcaseCms, /company_profile|merchant_settings|offer_banners|combo_pack_catalogue|theme_page_settings|theme_component_settings/);
});

test('both sites link to each other using their canonical HTTPS domains', () => {
  const showcaseUtil = readShowcase('src/lib/utils.ts');
  const cartFooter = read('src/components/Footer.tsx');
  assert.match(showcaseUtil, /https:\/\/cart\.rtcrackers\.com/);
  assert.match(cartFooter, /href="https:\/\/rtcrackers\.com\//);
});

test('SEO sitemap includes product detail routes but excludes transaction and account routes', () => {
  const sitemap = read('public/sitemap.xml');
  const robots = read('public/robots.txt');
  assert.match(sitemap, /https:\/\/cart\.rtcrackers\.com\/product\/127/);
  assert.match(sitemap, /https:\/\/cart\.rtcrackers\.com\/products/);
  for (const privatePath of ['/cart</loc>', '/my-orders</loc>', '/track-order</loc>', '/login</loc>', '/combos</loc>']) {
    assert.doesNotMatch(sitemap, new RegExp(privatePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(robots, /Allow: \//);
  assert.doesNotMatch(robots, /Disallow: \/(cart|my-orders|track-order|login)/);
  assert.match(robots, /Sitemap: https:\/\/cart\.rtcrackers\.com\/sitemap\.xml/);
  assert.match(read('package.json'), /generate-sitemap\.mjs && vite build/);
});

test('showcase has database-fed unique SEO pages and truthful online-order copy', () => {
  const cms = readShowcase('src/lib/cms.ts');
  const seoPage = readShowcase('src/app/[slug]/page.tsx');
  assert.match(cms, /from\("web_seo"\)/);
  assert.match(cms, /from\("web_pages"\)/);
  assert.match(seoPage, /title: \{ absolute: title \}/);
  assert.match(seoPage, /canonical/);
  assert.match(seoPage, /robots: \{ index, follow/);
  assert.match(seoPage, /does not accept online fireworks orders/);
});
