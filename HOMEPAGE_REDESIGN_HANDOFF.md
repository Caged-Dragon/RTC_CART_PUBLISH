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

Do not place a service-role key in browser environment variables. The archive intentionally excludes `.env.local` and other secrets.

## Verification performed in the packaging environment

- TypeScript/TSX syntax transpile check on all modified TypeScript files: passed.
- `npm run build`: blocked because the local dependency installation is incomplete (`vite: not found`).
- `npm run lint`: blocked because required `@types/*` and React type packages are missing from the incomplete `node_modules` directory.
- Live Supabase read verification: not completed. The URL configured in the supplied local environment references a project that did not match the projects available to the connected Supabase tooling, and direct database access from this environment failed. No database writes were attempted.
- Browser viewport/interactions: not executed in a running browser because the app dependencies could not be installed in the current environment.

After installing dependencies and confirming the target Supabase URL/public anon key, run the build and lint commands above, then verify the homepage at phone, tablet, and desktop sizes against the live data.
