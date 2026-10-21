import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const sitemapPath = resolve(root, 'public/sitemap.xml');
const defaultUrl = 'https://hhbpyxhtksgbkaigeutl.supabase.co';
const defaultKey = 'sb_publishable_3ezb3wRqhNxAC_mzfMz7ug_c86FWVyK';

function loadEnvFile(name) {
  return readFile(resolve(root, name), 'utf8').then((content) => {
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }).catch(() => {});
}

const baseRoutes = [
  ['/', 'weekly', '1.0'],
  ['/products', 'daily', '0.9'],
  ['/categories', 'weekly', '0.75'],
  ['/best-sellers', 'weekly', '0.75'],
  ['/price-list', 'daily', '0.85'],
  ['/transport', 'monthly', '0.55'],
  ['/safety', 'monthly', '0.65'],
  ['/about', 'monthly', '0.55'],
  ['/contact', 'monthly', '0.55'],
];

function renderSitemap(productSerials, modified) {
  const routes = [
    ...baseRoutes.map(([path, frequency, priority]) => ({ path, frequency, priority })),
    ...productSerials.map((serial) => ({ path: `/product/${serial}`, frequency: 'weekly', priority: '0.65' })),
  ];
  const rows = routes.map(({ path, frequency, priority }) =>
    `  <url><loc>https://cart.rtcrackers.com${path}</loc><lastmod>${modified}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

await loadEnvFile('.env');
await loadEnvFile('.env.local');
await loadEnvFile('.env.production');
await loadEnvFile('.env.production.local');

const url = (process.env.VITE_SUPABASE_URL || defaultUrl).replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || defaultKey;
try {
  const headers = { apikey: key, Accept: 'application/json' };
  const [productsResponse, pricesResponse] = await Promise.all([
    fetch(`${url}/rest/v1/products?select=product_id,source_serial_no&is_active=eq.true&order=source_serial_no.asc`, { headers, signal: AbortSignal.timeout(8000) }),
    fetch(`${url}/rest/v1/product_prices?select=product_id&is_current=eq.true`, { headers, signal: AbortSignal.timeout(8000) }),
  ]);
  if (!productsResponse.ok || !pricesResponse.ok) throw new Error(`catalogue API returned ${productsResponse.status}/${pricesResponse.status}`);
  const products = await productsResponse.json();
  const prices = await pricesResponse.json();
  const pricedIds = new Set(prices.map((row) => String(row.product_id)));
  const serials = [...new Set(products.filter((row) => pricedIds.has(String(row.product_id))).map((row) => Number(row.source_serial_no)).filter((n) => Number.isInteger(n) && n > 0))].sort((a,b) => a-b);
  if (!serials.length) throw new Error('the live query returned no active products with current price rows');
  const now = new Date().toISOString().slice(0,10);
  await writeFile(sitemapPath, renderSitemap(serials, now), 'utf8');
  process.stdout.write(`Updated sitemap: ${serials.length} product URLs and ${baseRoutes.length} public routes.\n`);
} catch (error) {
  // Deployment remains possible during a temporary DB outage; keep the committed, verified fallback sitemap.
  process.stderr.write(`Sitemap refresh skipped; retaining committed sitemap (${error instanceof Error ? error.message : String(error)}).\n`);
}
