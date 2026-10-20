const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('Vercel does not rewrite missing CSS/JS/image assets to index.html', () => {
  const config = JSON.parse(read('vercel.json'));
  assert.ok(config.rewrites.length > 0);
  assert.ok(config.rewrites.every((rule) => rule.destination === '/index.html'));
  assert.ok(config.rewrites.every((rule) => !rule.source.includes('(.*)')),
    'a catch-all rewrite can return HTML for missing hashed assets');
  const sources = new Set(config.rewrites.map((rule) => rule.source));
  for (const route of ['/products', '/categories', '/best-sellers', '/price-list', '/cart', '/my-orders', '/track-order', '/whatsapp-order', '/email-bill', '/login', '/combos', '/gift-boxes', '/transport', '/safety', '/reviews', '/about', '/contact', '/product/:productId']) {
    assert.ok(sources.has(route), `missing SPA route rewrite: ${route}`);
  }
});

test('HTML entry and service worker are not cached across deployments', () => {
  const config = JSON.parse(read('vercel.json'));
  const getHeaders = (source) => config.headers.find((entry) => entry.source === source)?.headers || [];
  for (const source of ['/', '/index.html', '/sw.js']) {
    assert.match(getHeaders(source).find((header) => header.key === 'Cache-Control')?.value || '', /no-cache.*no-store/);
  }
  const sw = read('public/sw.js');
  assert.match(sw, /rt-crackers-cart-v5-asset-mime-fix/);
  assert.match(sw, /!type\.includes\('text\/html'\)/);
  assert.match(sw, /wantsCss[\s\S]*type\.includes\('text\/css'\)/);
});

test('PWA install listener leaves browser native install prompt unprevented', () => {
  const prompt = read('src/components/PwaInstallPrompt.tsx');
  assert.match(prompt, /beforeinstallprompt/);
  assert.doesNotMatch(prompt, /event\.preventDefault\(\)/);
  assert.doesNotMatch(prompt, /\.prompt\(\)/);
});
