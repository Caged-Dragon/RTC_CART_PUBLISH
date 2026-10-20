# Logo and Banner Visibility Fix

## Original company logo verification

- The active `public.company_profile.logo_url` points to the public company-logo object in the `rtcrackers-images` Supabase Storage bucket.
- Supabase Storage returned ETag `e4ba4e0aaed8815ff3d790e54fbb2122` for that object. The local `src/assets/logo.jpeg` file has the same MD5 digest, which confirms the bundled fallback is the same image bytes as the database object—not a re-created or edited logo.
- `Navbar.tsx` and `AuthScreen.tsx` now display `storeInfo.logoUrl` first. The prior `onLoad` aspect-ratio branch that replaced square database logos with `/images/storefront/logo.jpg` was removed.
- If the remote URL fails, the frontend uses `src/assets/logo.jpeg`, the byte-identical fallback. The image uses `object-fit: contain`, centered, without filters or image cropping.

## Banner layout correction

- `HomeBanner.tsx` records the actual image dimensions from the loaded image and applies its natural ratio to the banner frame.
- The composed image now occupies an absolutely positioned layer inside that ratio-sized frame and uses `object-fit: contain`, so the full artwork remains visible without stretching.
- The blurred image remains decorative background fill only. The Shop Now / WhatsApp CTA bar is a separate normal-flow row after the banner image, with its own stacking context; it cannot cover the bottom of the artwork.
- On narrow screens, a landscape image erroneously configured as the mobile banner still switches to the bundled portrait-safe image.

## Verification

- `npm test`: 8 tests passed, including new logo-byte verification and natural-banner-ratio/CTA-flow assertions.
- TypeScript/TSX syntax transpile: 64 files, zero syntax errors.
- A complete project typecheck/production build could not run in this workspace because project dependencies (including React types and Vite) are not installed. Run `npm ci`, `npm run lint`, and `npm run build` locally before deploying.
