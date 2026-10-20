# RedThunder homepage redesign handoff

## What changed

- Reworked the homepage structure and responsive styling to align with the supplied desktop/mobile reference: live hero banners, trust strip, category grid, curated home picks, budget collections, combo packs, ordering steps, service strip, and footer CTA.
- Categories are loaded from the existing active `product_categories` rows, ordered by the current display fields, with a branded visual fallback when a category has no image.
- Current promotional banners and offers remain data-driven and respect active/scheduled windows. Their configured button destinations are resolved to existing app routes or safe HTTP(S) destinations, with a catalogue fallback for missing/unsupported targets.
- Homepage picks now read the existing active `homepage_customer_picks` configuration for `website_key=cart`, then bind rows to real catalogue products. Cards use the existing product/card/cart behavior; there are no fabricated product names or prices.
- Budget tiles are derived from published active combo data and its existing `budget_tier`/`calculated_price` fields. Clicking a tier opens the combo screen with that tier filter in the URL.
- Combo cards use `combo_pack_catalogue`, `website_key=cart`, active flags, database-supplied calculated prices, images, product lines, and current add-to-cart/detail-modal behavior.
- Search, category selection, mobile bottom navigation, cart badge, combo selection, offer CTAs, navigation active state, and footer policy/support routes were updated or wired to existing application behavior.
- No schema changes, migrations, seed writes, policy changes, or production record edits were performed.

## Main files updated

- `src/screens/IntroScreen.tsx`
- `src/screens/ProductsScreen.tsx`
- `src/components/Navbar.tsx`
- `src/components/HomeBanner.tsx`
- `src/components/LiveOffersSection.tsx`
- `src/components/ComboPacksSection.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/components/ProductCard.tsx`
- `src/components/Footer.tsx`
- `src/context/HomepagePicksContext.tsx`
- `src/context/ComboPacksContext.tsx`
- `src/utils/navigationTarget.ts` (new)
- `src/utils/shopNavigation.ts`
- `src/index.css`
- `src/App.tsx`

## Run locally

From the project directory:

```bash
npm ci
cp .env.example .env.local
# Set the existing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values for your project.
npm run dev
```

Production build and TypeScript check:

```bash
npm run build
npm run lint
```

Do not place a service-role key in browser environment variables. This handoff archive includes `.env.local` from your supplied CART project so it is immediately configured to the verified project; it contains the public publishable client key only. Keep `.env.local` excluded from source-control commits.

## Verification performed in the packaging environment

- TypeScript/TSX transpile check on all 62 source files: passed; no syntax diagnostics. Relative-import and local image-reference checks passed.
- `npm test`: passed (SWR cache regression test).
- `npm run lint` and the Vite build: not verified because React/Vite and other package dependencies are absent from this sandbox; install them locally and rerun.
- Supabase management access is now verified against the same project reference in `.env.local`: `ypmiinmkyvzdpakbkers` (`RtCrackers Cart`, `ap-south-1`). Live read-only SQL checks confirmed the homepage data sources and row counts; see `SUPABASE_CONNECTION_AUDIT.md`.
- Public REST smoke test: `npm run check:db` was added, but outbound HTTP requests are blocked in this sandbox, so run it from your local development network.
- Browser viewport/interactions: not executed in a running browser in this environment. No database writes were attempted.

After installing dependencies, run `npm ci`, `npm run check:db`, `npm run lint`, `npm test`, and `npm run build`, then verify phone, tablet, and desktop layouts against the live catalogue.


## Reference asset integration update — 20 October 2026

- Added `public/images/storefront/` assets from the supplied RedThunder reference: desktop/mobile hero, logo, category tiles, combo visuals and budget decoration.
- The hero uses the matching baked-in reference artwork only when no active database banner exists; active promotional banner records retain their existing navigation/content behavior. Accessible invisible hit areas keep the reference-art Shop Now and WhatsApp calls to action interactive.
- Categories continue to prioritize live uploaded images. Bundled visual fallbacks are used when uploads are missing, and broken uploaded URLs retry the local image before hiding the failed image.
- Homepage order keeps Category, Best Sellers, Budget and Combos in the reference order; optional configured live offers follow Combos and remain available before the How to Order/service content.
- Updated shared branding and normalized WhatsApp links across the homepage, navigation, footer, cart drawer and contact page. No routes, product/cart logic, Supabase contracts, database rows or migrations were removed or changed.
- Verification: TypeScript/TSX syntax transpile passed for 61 source files; CSS parsing reported no syntax errors; 17 local storefront image references resolved; `node --test tests/swr.test.cjs` passed. Full `npm run lint` / `npm run build` could not be completed in this sandbox because dependency installation timed out and the supplied tree lacks React/Vite packages; rerun after `npm ci` in a network-enabled environment.
