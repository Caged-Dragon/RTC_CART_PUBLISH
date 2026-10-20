#!/usr/bin/env node

/**
 * Read-only smoke test for the storefront's existing Supabase project.
 * Uses only the public publishable/anon key and reads active homepage tables.
 * Never prints the key and never writes to the database.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const envFile = readEnvFile(path.resolve(process.cwd(), '.env.local'));
const supabaseUrl = (process.env.VITE_SUPABASE_URL || envFile.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const publicKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || envFile.VITE_SUPABASE_PUBLISHABLE_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || envFile.VITE_SUPABASE_ANON_KEY
  || '';

if (!supabaseUrl || !publicKey) {
  console.error('Supabase connection settings are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.');
  process.exit(2);
}

const expectedProject = 'ypmiinmkyvzdpakbkers';
let parsedUrl;
try {
  parsedUrl = new URL(supabaseUrl);
} catch {
  console.error('VITE_SUPABASE_URL is not a valid URL.');
  process.exit(2);
}
if (parsedUrl.hostname !== `${expectedProject}.supabase.co`) {
  console.error(`Project mismatch: expected ${expectedProject}.supabase.co but found ${parsedUrl.hostname}.`);
  process.exit(2);
}

const checks = [
  ['products', 'products?select=id&is_active=eq.true&limit=1'],
  ['product_categories', 'product_categories?select=category_id&is_active=eq.true&limit=1'],
  ['homepage_customer_picks', 'homepage_customer_picks?select=id&website_key=eq.cart&is_active=eq.true&limit=1'],
  ['combo_pack_catalogue', 'combo_pack_catalogue?select=id&website_key=eq.cart&is_active=eq.true&limit=1'],
  ['offers', 'offers?select=id&is_active=eq.true&limit=1'],
  ['offer_banners', 'offer_banners?select=id&is_active=eq.true&limit=1'],
  ['company_profile', 'company_profile?select=id&is_active=eq.true&limit=1'],
  ['merchant_settings', 'merchant_settings?select=id&limit=1'],
  ['theme_page_settings(home)', 'theme_page_settings?select=theme_page_id&website_key=eq.cart&page_key=eq.home&is_active=eq.true&limit=1'],
];

console.log(`Checking read-only access to ${parsedUrl.hostname}`);
console.log('Only the public publishable/anon key is used; no writes are performed.\n');
let failures = 0;
for (const [name, resource] of checks) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${resource}`, {
      method: 'GET',
      headers: {
        apikey: publicKey,
        ...(publicKey.startsWith('eyJ') ? { Authorization: `Bearer ${publicKey}` } : {}),
        Accept: 'application/json',
        Prefer: 'count=exact',
      },
      signal: AbortSignal.timeout(12000),
    });
    const bodyText = await response.text();
    if (!response.ok) {
      failures += 1;
      console.log(`FAIL  ${name.padEnd(30)} HTTP ${response.status}`);
      try {
        const error = JSON.parse(bodyText);
        if (error.message) console.log(`      ${String(error.message).slice(0, 180)}`);
      } catch { /* omit raw response to avoid leaking accidental sensitive information */ }
      continue;
    }
    const rows = JSON.parse(bodyText);
    const countRange = response.headers.get('content-range');
    const total = countRange && countRange.includes('/') ? countRange.split('/').at(-1) : null;
    console.log(`PASS  ${name.padEnd(30)} ${total && total !== '*' ? `total rows: ${total}` : `sample rows: ${rows.length}`}`);
  } catch (error) {
    failures += 1;
    const detail = error?.name === 'TimeoutError' ? 'request timed out' : 'network request failed';
    console.log(`FAIL  ${name.padEnd(30)} ${detail}`);
  }
}

console.log('');
if (failures) {
  console.error(`${failures} of ${checks.length} read checks failed. Check network access, Supabase API availability, and public SELECT policies.`);
  process.exit(1);
}
console.log(`All ${checks.length} read checks passed. The storefront can read its active homepage data through Supabase REST.`);
