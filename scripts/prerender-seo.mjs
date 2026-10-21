#!/usr/bin/env node

/**
 * Generate crawlable, page-specific HTML head metadata for the Vite SPA routes.
 * This runs after `vite build`, writes only under dist/, and never modifies Supabase.
 * Product JSON-LD deliberately omits Offer/availability/rating fields because this site is catalogue-only.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.resolve(root, 'dist');
const origin = 'https://cart.rtcrackers.com';
const supabaseUrlFallback = 'https://hhbpyxhtksgbkaigeutl.supabase.co';
const publishableKeyFallback = 'sb_publishable_3ezb3wRqhNxAC_mzfMz7ug_c86FWVyK';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function jsonForHtml(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function readEnvFile(content) {
  const output = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    output[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return output;
}
async function loadEnvironment() {
  const env = {};
  for (const filename of ['.env.example', '.env', '.env.local', '.env.production', '.env.production.local']) {
    try { Object.assign(env, readEnvFile(await fs.readFile(path.resolve(root, filename), 'utf8'))); } catch { /* optional */ }
  }
  return { ...env, ...process.env };
}
function upsertMeta(html, attribute, name, content) {
  const re = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}="${escapeRegex(name)}")[^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}
function upsertCanonical(html, href) {
  const re = /<link\b(?=[^>]*\brel="canonical")[^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}
function seoHtml(template, { pathName, title, description, keywords = '', indexable = true, schema, image }) {
  const canonical = `${origin}${pathName === '/' ? '/' : pathName}`;
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'name', 'keywords', keywords);
  html = upsertMeta(html, 'name', 'robots', indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,follow');
  html = upsertMeta(html, 'name', 'googlebot', indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,follow');
  html = upsertMeta(html, 'property', 'og:title', title);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:url', canonical);
  if (image) html = upsertMeta(html, 'property', 'og:image', image);
  html = upsertMeta(html, 'name', 'twitter:title', title);
  html = upsertMeta(html, 'name', 'twitter:description', description);
  html = upsertMeta(html, 'name', 'twitter:url', canonical);
  if (image) html = upsertMeta(html, 'name', 'twitter:image', image);
  html = upsertCanonical(html, canonical);
  const schemaTag = `<script id="rt-prerendered-page-schema" type="application/ld+json">${jsonForHtml(schema || { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonical, inLanguage: 'en-IN' })}</script>`;
  const oldSchema = /<script\b[^>]*id="rt-prerendered-page-schema"[^>]*>[\s\S]*?<\/script>/i;
  html = oldSchema.test(html) ? html.replace(oldSchema, schemaTag) : html.replace(/<\/head>/i, `  ${schemaTag}\n</head>`);
  return html;
}

const publicPages = [
  { path: '/', title: 'Sivakasi Crackers Catalogue 2026 | RedThunder Crackers', description: 'Browse the RedThunder Crackers catalogue from Rajukanna Fireworks, Sivakasi. Makka & Wheat brand product information and general enquiries; online fireworks orders are not accepted.', keywords: 'Sivakasi crackers catalogue 2026, RedThunder Crackers, Makka and Wheat brand, Rajukanna Fireworks, Sivakasi product catalogue', indexable: true },
  { path: '/products', title: 'Sivakasi Crackers Product Catalogue | RedThunder Crackers', description: 'Browse product descriptions, categories and current catalogue rates from RedThunder Crackers, Rajukanna Fireworks, Sivakasi. General product information only; no online fireworks orders.', keywords: 'Sivakasi crackers catalogue, RedThunder Crackers product list, Makka and Wheat brand catalogue', indexable: true },
  { path: '/categories', title: 'Crackers Catalogue by Category | RedThunder Crackers', description: 'Explore RedThunder Crackers catalogue categories, including sparklers, flower pots, ground wheels, rockets and other listed product groups where available.', keywords: 'Sivakasi crackers categories, sparklers catalogue, flower pots catalogue, fireworks category list', indexable: true },
  { path: '/best-sellers', title: 'Popular Catalogue Highlights | RedThunder Crackers', description: 'Browse products flagged as popular or featured in the connected RedThunder catalogue. Highlights are catalogue labels, not customer ratings or independent rankings.', keywords: 'RedThunder Crackers popular catalogue items, featured Sivakasi crackers catalogue', indexable: true },
  { path: '/price-list', title: '2026 Crackers Price List | RedThunder Crackers, Sivakasi', description: 'Check the current RedThunder Crackers 2026 catalogue rates sourced from the shared database. Product rates and availability can change; contact the business for information.', keywords: 'Sivakasi crackers price list 2026, RedThunder Crackers price list, Makka and Wheat catalogue rates', indexable: true },
  { path: '/transport', title: 'Transport & Delivery Information | RedThunder Crackers', description: 'Read about delivery coverage and transporter collection for the RedThunder Crackers catalogue. Confirm destination serviceability and charges directly with the business.', keywords: 'Sivakasi transport information, Tamil Nadu transporter delivery, RedThunder delivery information', indexable: true },
  { path: '/safety', title: 'Fireworks Safety Guide | RedThunder Crackers', description: 'Review general fireworks safety guidance, adult supervision, safe distances, outdoor use and the need to follow local regulations and product instructions.', keywords: 'fireworks safety guide, safe fireworks handling, adult supervision, firework precautions India', indexable: true },
  { path: '/about', title: 'About Rajukanna Fireworks | Makka & Wheat Brand, Sivakasi', description: 'Learn about RedThunder Crackers and the Makka & Wheat brand associated with Rajukanna Fireworks in Sivakasi, established in 1995.', keywords: 'Rajukanna Fireworks Sivakasi, Makka and Wheat brand, RedThunder Crackers company information', indexable: true },
  { path: '/contact', title: 'Contact RedThunder Crackers | Sivakasi Product Information', description: 'Contact RedThunder Crackers for catalogue questions and general product information. Primary support +91 8124100501; sales@rtcrackers.com.', keywords: 'RedThunder Crackers contact, Sivakasi support, Makka and Wheat product information, Rajukanna Fireworks contact', indexable: true },
  { path: '/cart', title: 'Product Shortlist | RedThunder Crackers', description: 'Keep a local product shortlist for reference. This website does not submit online fireworks orders or payments.', keywords: 'RedThunder product shortlist', indexable: false },
  { path: '/my-orders', title: 'Historical Orders | RedThunder Crackers', description: 'View historical order records linked to an authenticated account, where access is available.', keywords: 'RedThunder historical orders', indexable: false },
  { path: '/track-order', title: 'Historical Order Tracking | RedThunder Crackers', description: 'Review tracking information for an existing historical consignment where available. This route does not create a new order.', keywords: 'RedThunder historical order tracking', indexable: false },
  { path: '/login', title: 'Account Sign In | RedThunder Crackers', description: 'Sign in to access account features and historical account information.', keywords: 'RedThunder account sign in', indexable: false },
  { path: '/whatsapp-order', title: 'Contact Sales on WhatsApp | RedThunder Crackers', description: 'Open general product-information support on WhatsApp. Do not send payment details; this website does not accept online fireworks orders.', keywords: 'RedThunder general product enquiry', indexable: false },
  { path: '/email-bill', title: 'Email Sales Support | RedThunder Crackers', description: 'Contact sales support with a general product-information question. The website does not accept online fireworks orders or payments.', keywords: 'RedThunder sales contact', indexable: false },
  { path: '/combos', title: 'Catalogue Groupings | RedThunder Crackers', description: 'Review catalogue groupings when published. This page does not submit online fireworks orders.', keywords: 'RedThunder catalogue groupings', indexable: false },
  { path: '/gift-boxes', title: 'Gift Box Catalogue Information | RedThunder Crackers', description: 'Review available catalogue information for gift box products where published. General information only.', keywords: 'RedThunder gift box catalogue', indexable: false },
  { path: '/reviews', title: 'Customer Feedback | RedThunder Crackers', description: 'Customer feedback information for RedThunder Crackers, where available.', keywords: 'RedThunder Crackers customer feedback', indexable: false },
  { path: '/add', title: 'Open Product Catalogue | RedThunder Crackers', description: 'Open the public product catalogue. Product links do not add items to an order.', keywords: 'RedThunder product catalogue', indexable: false },
];

async function readApi(url, key) {
  const headers = { apikey: key, Accept: 'application/json', ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) };
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
  return response.json();
}

async function fetchProducts(env) {
  const base = (env.VITE_SUPABASE_URL || supabaseUrlFallback).replace(/\/$/, '');
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || publishableKeyFallback;
  const qs = (table, query) => readApi(`${base}/rest/v1/${table}?${query}`, key);
  const [products, prices, categories, packs, images] = await Promise.all([
    qs('products', 'select=product_id,source_serial_no,product_name,category_id,pack_type_id,keywords&is_active=eq.true&order=source_serial_no.asc&limit=1000'),
    qs('product_prices', 'select=product_id,price_year,price_amount,is_current&is_current=eq.true&order=price_year.desc&limit=1000'),
    qs('product_categories', 'select=category_id,category_name&is_active=eq.true&limit=1000'),
    qs('product_pack_types', 'select=pack_type_id,pack_type_name&limit=1000'),
    qs('product_images', 'select=product_id,image_url,alt_text,is_primary,is_active,display_order&is_active=eq.true&order=is_primary.desc,display_order.asc&limit=1000'),
  ]);
  const categoryNames = new Map(categories.map((row) => [String(row.category_id), row.category_name]));
  const packNames = new Map(packs.map((row) => [String(row.pack_type_id), row.pack_type_name]));
  const priceByProduct = new Map();
  for (const row of prices) {
    const id = String(row.product_id); const old = priceByProduct.get(id); const year = Number(row.price_year) || 0;
    if (!old || year > old.year) priceByProduct.set(id, { price: Number(row.price_amount) || 0, year });
  }
  const imageByProduct = new Map();
  for (const row of images) if (!imageByProduct.has(String(row.product_id))) imageByProduct.set(String(row.product_id), row);
  return products.flatMap((row) => {
    const serial = Number(row.source_serial_no); const price = priceByProduct.get(String(row.product_id));
    if (!Number.isInteger(serial) || serial < 1 || !row.product_name || !price?.price) return [];
    return [{
      serial, id: String(row.product_id), name: String(row.product_name), category: categoryNames.get(String(row.category_id)) || 'Crackers Catalogue',
      pack: packNames.get(String(row.pack_type_id)) || 'Pack', price: price.price, year: price.year || 2026,
      keywords: Array.isArray(row.keywords) ? row.keywords.filter((item) => typeof item === 'string') : [],
      image: imageByProduct.get(String(row.product_id))?.image_url || '',
      alt: imageByProduct.get(String(row.product_id))?.alt_text || `${row.product_name} — RedThunder Crackers catalogue`,
    }];
  });
}

async function main() {
  const templatePath = path.join(dist, 'index.html');
  let template;
  try { template = await fs.readFile(templatePath, 'utf8'); } catch {
    console.log('SEO prerender skipped: dist/index.html was not produced by the build.');
    return;
  }
  const env = await loadEnvironment();
  let products = [];
  try { products = await fetchProducts(env); } catch (error) {
    console.warn(`Live product metadata query skipped (${error instanceof Error ? error.message : String(error)}); generic metadata shells will be generated.`);
  }
  let sitemap = '';
  try { sitemap = await fs.readFile(path.resolve(root, 'public/sitemap.xml'), 'utf8'); } catch { /* product routes are also sourced from the DB */ }
  const sitemapSerials = [...sitemap.matchAll(/<loc>https:\/\/cart\.rtcrackers\.com\/product\/(\d+)<\/loc>/g)].map((match) => Number(match[1]));
  const bySerial = new Map(products.map((product) => [product.serial, product]));
  const serials = [...new Set([...sitemapSerials, ...products.map((product) => product.serial)])].filter((n) => Number.isInteger(n) && n > 0).sort((a,b) => a-b);

  let generated = 0;
  for (const page of publicPages) {
    const schema = page.indexable
      ? { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: `${origin}${page.path}`, inLanguage: 'en-IN', isPartOf: { '@type': 'WebSite', '@id': 'https://cart.rtcrackers.com/#website' }, about: { '@type': 'Organization', '@id': 'https://rtcrackers.com/#business' } }
      : { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: `${origin}${page.path}`, inLanguage: 'en-IN' };
    const html = seoHtml(template, { ...page, pathName: page.path, schema, image: 'https://hhbpyxhtksgbkaigeutl.supabase.co/storage/v1/object/public/website-media/banners/rtcrackers%20bannar.jpeg' });
    if (page.path === '/') {
      await fs.writeFile(templatePath, html, 'utf8');
    } else {
      const targetDir = path.join(dist, page.path.replace(/^\/+|\/+$/g, ''));
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, 'index.html'), html, 'utf8');
    }
    generated++;
  }
  for (const serial of serials) {
    const product = bySerial.get(serial);
    const title = product ? `${product.name} | ${product.category} | RedThunder Crackers` : `Product ${serial} | RedThunder Crackers Catalogue`;
    const description = product
      ? `${product.name} (${product.pack}) in the ${product.category} category of the RedThunder Crackers catalogue from Sivakasi. Listed catalogue rate ₹${product.price.toLocaleString('en-IN')}; confirm current details with the business. No online fireworks orders or payments are accepted.`
      : `Product ${serial} in the RedThunder Crackers catalogue from Rajukanna Fireworks, Sivakasi. Confirm current product information directly with the business. No online fireworks orders or payments are accepted.`;
    const keywords = product ? [...new Set([product.name, product.category, ...product.keywords, 'RedThunder Crackers', 'Makka & Wheat brand', 'Sivakasi crackers catalogue'])].join(', ') : 'RedThunder Crackers, Sivakasi product catalogue';
    const schema = product ? {
      '@context': 'https://schema.org', '@type': 'Product', name: product.name,
      description, category: product.category, sku: String(product.serial),
      brand: { '@type': 'Brand', name: 'Makka & Wheat' }, manufacturer: { '@type': 'Organization', '@id': 'https://rtcrackers.com/#business', name: 'Rajukanna Fireworks' },
      url: `${origin}/product/${serial}`, ...(product.image ? { image: product.image } : {}),
    } : { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: `${origin}/product/${serial}` };
    const html = seoHtml(template, { pathName: `/product/${serial}`, title, description, keywords, indexable: true, image: product?.image || 'https://hhbpyxhtksgbkaigeutl.supabase.co/storage/v1/object/public/website-media/banners/rtcrackers%20bannar.jpeg', schema });
    const targetDir = path.join(dist, 'product', String(serial));
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, 'index.html'), html, 'utf8');
    generated++;
  }
  console.log(`Generated ${generated} static SEO HTML shells (${serials.length} product routes; ${products.length} enriched with current database metadata).`);
}

main().catch((error) => {
  // Do not fail a valid front-end build solely because the SEO shell task lost network access.
  console.error(`SEO prerender failed safely: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 0;
});
