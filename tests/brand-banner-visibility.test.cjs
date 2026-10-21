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
  assert.match(read('src/context/StoreContext.tsx'), /dbSelect<any>\('web_media'.*media_url,media_name,alt_text/s);
  assert.match(read('src/context/StoreContext.tsx'), /domain=eq\.cart\.rtcrackers\.com/);
  assert.match(read('src/context/StoreContext.tsx'), /logoUrl:\s*media\?\.media_url\s*\|\|\s*FALLBACK_INFO\.logoUrl/);
  assert.match(navbar, /src=\{storeInfo\.logoUrl\s*\|\|\s*exactCompanyLogoFallback\}/);
  assert.match(auth, /src=\{storeInfo\.logoUrl\s*\|\|\s*exactCompanyLogoFallback\}/);
  assert.doesNotMatch(navbar, /naturalWidth\s*\/\s*image\.naturalHeight\s*<\s*2/);
  assert.doesNotMatch(auth, /naturalWidth\s*\/\s*image\.naturalHeight\s*<\s*2/);
  assert.match(css, /\.rt-brand-mark img\s*\{[^}]*object-fit:\s*contain;[^}]*object-position:\s*center;[^}]*filter:\s*none;/s);
  assert.match(css, /\.rt-auth-brand-logo\s*\{[^}]*object-fit:\s*contain;[^}]*object-position:\s*center;[^}]*filter:\s*none;/s);
});

test('database banners use an accessible fixed 4:3 carousel while keeping the complete creative visible', () => {
  const css = read('src/index.css');
  const banner = read('src/components/HomeBanner.tsx');
  const functionalPolish = css.slice(css.indexOf('Functional polish:'));
  assert.match(banner, /style=\{\{\s*aspectRatio:\s*'4 \/ 3'\s*\}\}/);
  assert.doesNotMatch(banner, /bannerAspectRatio|setBannerAspectRatio/);
  assert.match(banner, /className="rt-hero-composed-backdrop"/);
  assert.match(banner, /className="rt-hero-composed-image"/);
  assert.match(banner, /onTouchStart=/);
  assert.match(banner, /onTouchEnd=/);
  assert.match(banner, /aria-label="Previous promotion"/);
  assert.match(banner, /aria-label="Next promotion"/);
  assert.match(banner, /onError=\{\(\) => setBannerImageFailed\(true\)\}/);
  assert.match(functionalPolish, /\.rt-hero-composed\s*\{[^}]*aspect-ratio:\s*4 \/ 3 !important;/s);
  assert.match(functionalPolish, /\.rt-hero-composed-backdrop img\s*\{[^}]*object-fit:\s*cover;[^}]*filter:\s*blur\(15px\)/s);
  assert.match(functionalPolish, /\.rt-hero-composed-image img\s*\{[^}]*object-fit:\s*contain !important;/s);
  assert.match(css, /\.rt-hero-cta-bar\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;[^}]*flex:\s*0 0 auto;/s);
});
