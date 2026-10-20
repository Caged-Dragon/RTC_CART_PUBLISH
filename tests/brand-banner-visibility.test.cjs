const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('the navbar wordmark uses a wide, non-cropping logo frame', () => {
  const css = read('src/index.css');
  const navbar = read('src/components/Navbar.tsx');
  assert.match(css, /\.rt-brand-mark\s*\{[^}]*width:\s*188px;[^}]*height:\s*74px;[^}]*overflow:\s*visible/s);
  assert.match(css, /\.rt-brand-mark img\s*\{[^}]*object-fit:\s*contain;[^}]*object-position:\s*center/s);
  assert.match(navbar, /src=\{storeInfo\.logoUrl\s*\|\|\s*'\/images\/storefront\/logo\.jpg'\}/);
  assert.match(navbar, /image\.naturalWidth \/ image\.naturalHeight < 2/);
  assert.match(read('src/screens/AuthScreen.tsx'), /image\.naturalWidth \/ image\.naturalHeight < 2/);
});

test('the complete banner is contained within a bounded responsive frame', () => {
  const css = read('src/index.css');
  const banner = read('src/components/HomeBanner.tsx');
  assert.match(css, /\.rt-hero-composed\s*\{[^}]*height:\s*clamp\(360px,\s*40vw,\s*540px\);[^}]*max-height:\s*min\(540px,\s*68svh\)/s);
  assert.match(css, /\.rt-hero-composed-image img\s*\{[^}]*max-width:\s*100%;[^}]*max-height:\s*100%;[^}]*object-fit:\s*contain;/s);
  assert.match(css, /\.rt-hero-composed-backdrop\s*\{[^}]*object-fit:\s*cover;[^}]*filter:\s*blur\(/s);
  assert.match(banner, /className="rt-hero-composed-backdrop"/);
  assert.match(banner, /onError=\{\(\) => setBannerImageFailed\(true\)\}/);
  assert.match(banner, /window\.matchMedia\('\(max-width: 640px\)'\)\.matches/);
  assert.match(banner, /image\.naturalWidth > image\.naturalHeight \* 1\.25/);
  assert.match(banner, /setUseReferenceMobileArt\(true\)/);
});
