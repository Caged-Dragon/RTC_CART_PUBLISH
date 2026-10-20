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
  assert.doesNotMatch(banner, /bannerAspectRatio|setBannerAspectRatio/);
  assert.doesNotMatch(banner, /style=\{\{\s*aspectRatio:/);
  assert.match(css, /\.rt-hero-dynamic\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);
  assert.match(css, /\.rt-hero-composed\s*\{[^}]*height:\s*min\(56\.25vw,\s*68svh,\s*680px\);[^}]*min-height:\s*260px;[^}]*max-height:\s*680px;/s);
  assert.match(css, /@media \(max-width:\s*640px\)\s*\{\s*\.rt-hero-composed\s*\{[^}]*height:\s*min\(136vw,\s*72svh,\s*620px\);/s);
  assert.match(css, /\.rt-hero-composed-image\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s);
  assert.match(css, /\.rt-hero-composed-image img\s*\{[^}]*width:\s*auto;[^}]*height:\s*auto;[^}]*max-width:\s*100%;[^}]*max-height:\s*100%;[^}]*object-fit:\s*contain;/s);
  assert.match(css, /\.rt-hero-cta-bar\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;[^}]*flex:\s*0 0 auto;/s);
  assert.match(banner, /className="rt-hero-composed-backdrop"/);
  assert.match(banner, /onError=\{\(\) => setBannerImageFailed\(true\)\}/);
});
