#!/usr/bin/env node

/** Read-only smoke test of the shared production Supabase schema. Never writes data or prints the key. */
import fs from 'node:fs';
import path from 'node:path';

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    result[key] = value;
  }
  return result;
}

const env = {
  ...readEnvFile(path.resolve(process.cwd(), '.env.example')),
  ...readEnvFile(path.resolve(process.cwd(), '.env')),
  ...readEnvFile(path.resolve(process.cwd(), '.env.local')),
  ...process.env,
};
const supabaseUrl = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !publicKey) {
  console.error('Supabase settings are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  process.exit(2);
}

const expectedProject = 'hhbpyxhtksgbkaigeutl';
let parsedUrl;
try { parsedUrl = new URL(supabaseUrl); } catch {
  console.error('VITE_SUPABASE_URL is not a valid URL.');
  process.exit(2);
}
if (parsedUrl.hostname !== `${expectedProject}.supabase.co`) {
  console.error(`Project mismatch: expected ${expectedProject}.supabase.co; found ${parsedUrl.hostname}.`);
  process.exit(2);
}

const checks = [
  ['active showcase site', 'app_sites?select=site_id&domain=eq.rtcrackers.com&is_active=eq.true&limit=1'],
  ['active storefront site', 'app_sites?select=site_id&domain=eq.cart.rtcrackers.com&is_active=eq.true&limit=1'],
  ['normalized active products', 'products?select=product_id,source_serial_no&is_active=eq.true&limit=1'],
  ['current catalogue prices', 'product_prices?select=product_id,price_year,price_amount&is_current=eq.true&limit=1'],
  ['active categories', 'product_categories?select=category_id&is_active=eq.true&limit=1'],
  ['pack types', 'product_pack_types?select=pack_type_id&limit=1'],
  ['active product images', 'product_images?select=product_id,image_url&is_active=eq.true&limit=1'],
  ['public media assets', 'web_media?select=media_id,media_url&is_public=eq.true&is_active=eq.true&limit=1'],
  ['public site settings', 'web_settings?select=setting_key&is_public=eq.true&limit=1'],
  ['active default theme', 'web_themes?select=theme_key&is_active=eq.true&is_default=eq.true&limit=1'],
  ['published public CMS pages', 'web_pages?select=page_id,slug&status=eq.published&visibility=eq.public&limit=1'],
  ['page SEO records', 'web_seo?select=page_id,meta_title,canonical_url&limit=1'],
];

console.log(`Checking read-only access to ${parsedUrl.hostname}`);
console.log('Uses the public publishable/anon key; no writes are performed and the key is never printed.\n');
let failures = 0;
for (const [name, resource] of checks) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${resource}`, {
      headers: {
        apikey: publicKey,
        ...(publicKey.startsWith('eyJ') ? { Authorization: `Bearer ${publicKey}` } : {}),
        Accept: 'application/json', Prefer: 'count=exact',
      },
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.text();
    if (!response.ok) {
      failures++;
      console.log(`FAIL  ${name.padEnd(30)} HTTP ${response.status}`);
      try { const error = JSON.parse(body); if (error.message) console.log(`      ${String(error.message).slice(0, 160)}`); } catch { /* Don't print raw API bodies. */ }
      continue;
    }
    const rows = JSON.parse(body);
    const range = response.headers.get('content-range');
    const count = range?.includes('/') ? range.split('/').at(-1) : null;
    console.log(`PASS  ${name.padEnd(30)} ${count && count !== '*' ? `rows: ${count}` : `sample rows: ${rows.length}`}`);
    if (['active showcase site', 'active storefront site', 'normalized active products', 'current catalogue prices', 'active categories', 'page SEO records'].includes(name) && rows.length === 0) {
      failures++;
      console.log('      Expected records were not visible to the public role.');
    }
  } catch (error) {
    failures++;
    const detail = error?.name === 'TimeoutError' ? 'request timed out' : 'network request failed';
    console.log(`FAIL  ${name.padEnd(30)} ${detail}`);
  }
}
console.log('');
if (failures) {
  console.error(`${failures} read/connectivity check(s) failed. Check network DNS, Supabase REST/Data API exposure, and public SELECT policies.`);
  process.exit(1);
}
console.log(`All ${checks.length} shared-schema read checks passed.`);
