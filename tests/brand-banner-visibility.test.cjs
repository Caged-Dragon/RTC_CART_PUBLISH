const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('navbar and account screen preserve the unmodified Supabase company logo', () => {
  const css = read('src/index.css');
  const navbar = read('src/components/Navbar.tsx');
  const auth = read('src/screens/AuthScreen.tsx');
  const logoPath = path.join(process.cwd(), 'src/assets/logo.jpeg');
  const dbLogoEtag = 'e4ba4e0aaed8815ff3d790e54fbb2122';
  const localLogoHash = crypto.createHash('md5').update(fs.readFileSync(logoPath)).digest('hex');

  // This digest matches the eTag returned by Supabase Storage for company_profile.logo_url.
  assert.equal(localLogoHash, dbLogoEtag);
  assert.match(read('src/context/StoreContext.tsx'), /logoUrl:\s*r\.logo_url\s*\|\|\s*FALLBACK_INFO\.logoUrl/);
  assert.match(navbar, /src=\{storeInfo\.logoUrl\s*\|\|\s*exactCompanyLogoFallback\}/);
  assert.match(auth, /src=\{storeInfo\.logoUrl\s*\|\|\s*exactCompanyLogoFallback\}/);
  assert.doesNotMatch(navbar, /naturalWidth\s*\/\s*image\.naturalHeight\s*<\s*2/);
  assert.doesNotMatch(auth, /naturalWidth\s*\/\s*image\.naturalHeight\s*<\s*2/);
  assert.match(css, /\.rt-brand-mark img\s*\{[^}]*object-fit:\s*contain;[^}]*object-position:\s*center;[^}]*filter:\s*none;/s);
  assert.match(css, /\.rt-auth-brand-logo\s*\{[^}]*object-fit:\s*contain;[^}]*object-position:\s*center;[^}]*filter:\s*none;/s);
});

test('database banners scale responsively without fixed image ratios or CTA overlap', () => {
  const css = read('src/index.css');
  const banner = read('src/components/HomeBanner.tsx');
  assert.match(banner, /bannerAspectRatio/);
  assert.match(banner, /setBannerAspectRatio\(\`\$\{image\.naturalWidth\} \/ \$\{image\.naturalHeight\}\`\)/);
  assert.match(banner, /style=\{\{\s*aspectRatio:\s*bannerAspectRatio\s*\}\}/);
  assert.match(css, /\.rt-hero-dynamic\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);
  assert.match(css, /\.rt-hero-composed\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto !important;[^}]*min-height:\s*0 !important;[^}]*max-height:\s*none !important;/s);
  assert.doesNotMatch(css.slice(css.lastIndexOf('/* Fluid database banner:')), /height:\s*min\(|max-height:\s*min\(/);
  assert.match(css, /\.rt-hero-composed-image\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s);
  assert.match(css, /\.rt-hero-composed-image img\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;/s);
  assert.match(css, /\.rt-hero-cta-bar\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;[^}]*flex:\s*0 0 auto;/s);
  assert.match(banner, /className="rt-hero-composed-backdrop"/);
  assert.match(banner, /onError=\{\(\) => setBannerImageFailed\(true\)\}/);
});
