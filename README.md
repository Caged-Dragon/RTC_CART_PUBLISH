# RT Crackers – Customer Cart (cart.rtcrackers.com)

React 19 + Vite + Tailwind storefront backed by Supabase (project `RTCrackers`). Orders are booked in the
database and then sent to the Sivakasi desk on WhatsApp (no online payment).

## Run locally
```
npm install
cp .env.example .env.local     # set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```
`npm run lint` type-checks, `npm run build` creates `dist/`.

## What lives where
- `src/context/*` – data providers (products, categories, store + merchant rules, auth, cart, theme, toasts)
- `src/screens/*`, `src/components/*` – UI. Screens are code-split with `React.lazy`.
- `public/images/*` – catalogue photos (served as `/images/...`; cached for a year by `vercel.json`)
- `supabase/*.sql` – earlier setup scripts; `supabase/migrations/` – reviewed, not-yet-applied changes
- `DEPLOYMENT.md` – Vercel set-up

## Business rules come from the database
`company_profile` (name, address, WhatsApp number, logo) and `merchant_settings` (minimum order value,
season-booking open/closed, booking number) are read at runtime – change them in Supabase/admin and the
site follows, no redeploy.

## Storefront features
- Real URLs per screen (`/products`, `/price-list`, `/cart` …) with Back-button support and per-page titles
- Quick Order by S.No (`25x4, 97, 12`), price-band filters, live result count
- Minimum-order progress bar with one-click "quick adds"; season-booking switch
- Order saved once, then re-sendable on WhatsApp; guest tracking code shown on success
- Cart auto-syncs with live catalogue prices; silent login-token refresh; error boundary; installable PWA

## Database policy
This app only **reads** `products`, `product_categories`, `company_profile`, `merchant_settings`, offers and
reviews, and calls the existing `create_order` RPC. The Supabase schema is shared with other sites, so nothing
here alters it. `supabase/migrations/*` is optional and must be reviewed against every site before it is run.

## RedThunder 3.0 UI architecture
The storefront UI is frontend-only and is intentionally isolated from the live database contracts. Theme values are read from the existing `theme_page_settings` table using `website_key=cart`; the frontend does not create, update, migrate or delete theme/data tables. New UI screens such as `/about` and `/contact` reuse the existing `cart/home` theme row so they remain consistent with database-controlled styling.

The product detail URL is shareable as `/product/<product-id>` while the existing `/products?product=<id>` form remains supported for backwards compatibility.


### Combo packs

The storefront includes 24 predefined combo recipes. They are frontend selection rules that dynamically resolve against the live `products` catalogue; they do not create or update Supabase data.
