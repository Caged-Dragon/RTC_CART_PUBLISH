# RT Crackers – Customer Cart (cart.rtcrackers.com)

React 19 + Vite + Tailwind storefront backed by Supabase (project `RTCrackers`). Orders are booked in the
database and then sent to the Sivakasi desk on WhatsApp (no online payment).


## Authentication and category navigation update

- The account screen uses Supabase Auth for password sign-in, account creation, password reset/update and currently enabled OAuth providers. It includes email/phone validation, password confirmation and visibility controls, clear error states, recovery messaging, session verification/refresh, and safe PKCE callback handling.
- The homepage category section is a concise preview. `/categories` lists all active categories from Supabase with live product counts and a category search. Selecting a category opens `/products?category=...`; the chosen filter is shareable and is restored on refresh/back/forward navigation.
- The app uses the existing `public.product_categories` and `public.products` records. No new category/product seed data is required.
- See `LOGIN_AND_CATEGORY_UX_UPDATE.md` for changes and validation details.

## Run locally
```bash
cp .env.example .env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.
npm ci
npm test
npm run lint
npm run build
npm run check:db                # read-only Supabase REST smoke test
npm run dev
```
`.env.local` is deliberately excluded from handoff archives. Use the browser-safe publishable key only; never place a service-role key in a VITE_ variable. `npm run lint` type-checks, `npm run build` creates `dist/`, and `npm test` runs authentication, navigation and SWR regression tests.

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
The storefront is a frontend application integrated directly with the existing live Supabase data contracts. Catalogue, business configuration, offers, combos, curated picks, and theme values are read from the existing tables/views; the frontend update does not create, update, migrate, or delete production data tables. New UI screens such as `/about` and `/contact` reuse the existing `cart/home` theme row so they remain consistent with database-controlled styling.

The product detail URL is shareable as `/product/<product-id>` while the existing `/products?product=<id>` form remains supported for backwards compatibility.


### Combo packs

Combo packs are read from the existing `combo_pack_catalogue` database view filtered by `website_key=cart`; item rates and calculated combo prices come from live `products` and the view. The homepage budget cards are derived from the active combo records' `budget_tier` and calculated prices. No duplicate recipe data is hardcoded into the homepage.

## Transactional email delivery

Customer transactional mail is handled server-side by `supabase/functions/transactional-email/index.ts` using Resend. The browser never receives the Resend API key. The sender is resolved at runtime from `business_email_purposes` + `business_email_addresses`, and sent messages are recorded in `email_messages` / `email_recipients` with the Resend message ID.

Supported automatic flows in this codebase:
- Supabase Auth confirmation/reset/magic-link/security emails through the **Send Email** Auth Hook.
- Order confirmation immediately after a successful `create_order` RPC.
- Customer quotation emails from the Email Quotation screen.
- An `order_status` mail action is included in the server function for order-lifecycle integrations.

## Reference-matched homepage visuals

- `public/images/storefront/` contains the responsive desktop/mobile hero artwork and category/combo reference assets used by the latest homepage refresh.
- Active banner records and uploaded category images from the existing database take precedence over bundled fallbacks.
- Category tiles recover to local reference imagery if a configured image URL fails, then fall back to a catalogue image where available.
- WhatsApp links normalize formatted phone numbers and fall back to the Contact screen if no usable number is configured.
- All existing storefront routes, account/order flows, cart behavior, live catalogue data, and combo detail/add-to-cart behavior remain in the React app.

## Best Sellers storefront page

The customer-facing Best Sellers route is `/best-sellers`. The home page features approximately 55% of the same curated/catalogue-marked best-seller collection; the dedicated page exposes search, category filtering, and sorting. See `BEST_SELLERS_HANDOFF.md` for behaviour and verification notes.


## Verified Supabase connection and homepage data

- The verified project reference is `ypmiinmkyvzdpakbkers` (`RtCrackers Cart`, `ap-south-1`). Set the project URL and browser-safe publishable key in a local `.env.local`; this private environment file is not packaged.
- The current homepage reads active product rows, active categories, curated `homepage_customer_picks`, active `combo_pack_catalogue` rows, current offer banners/offers, company profile, merchant settings, and the active `theme_page_settings` row for `website_key=cart`.
- Run `npm run check:db` locally to validate public REST reads from your machine. It performs only SELECT requests and never modifies live data.
- The database currently has no `image_url` for active categories and combo packs. The UI therefore prefers any configured database image URL and uses bundled reference/category artwork only as a fallback. Product images also prefer their database URL fields.
- Static UI copy and decorative icons remain frontend presentation because the current schema does not have a dedicated editable content field for every label. Product names/prices/stock, categories, curated picks, banner content, combo data/prices, company details, merchant rules, and page theme values are read from Supabase.
- The connected Supabase management interface successfully queried the live database. The sandbox used for this handoff could not make outbound REST HTTP requests, so the included `check:db` command still needs to be run from your network before claiming a browser-to-REST smoke test passed.
- The UI update did not change catalogue, price, offer, or combo records. Separately, the live migration `20261020142658_protect_admin_business_profile_phones` was applied: it clears `phone` and `phone_number` from active admin/business-linked customer profiles and keeps those fields empty on future Auth-triggered profile sync. The store's public company/WhatsApp contacts were not changed.

## Native Supabase customer authentication

Customer signup, email/password login, email-confirmation handling, password recovery/password updates, OAuth redirects, token refresh, and server-side logout use Supabase Auth endpoints. Credentials and password validation are never handled by `public.users`; that table stores only the linked customer profile. The database trigger `private.handle_new_auth_user` links/creates the profile after Supabase Auth inserts an identity. See `AUTH_NATIVE_SUPABASE_HANDOFF.md` for the live-project audit and dashboard setup requirements.

## OAuth login

OAuth buttons are discovered from enabled provider flags returned by Supabase Auth settings. The login uses authorization-code + PKCE and exchanges the callback code through Supabase Auth. See [OAUTH_LOGIN_SETUP.md](./OAUTH_LOGIN_SETUP.md) for provider configuration and callback URLs.


## Login and category navigation update

- The login experience has separate Sign in / Create account modes; password visibility toggles, confirmation matching, name/email/Indian mobile validation, recovery/confirmation guidance, accessible status messages and provider buttons based on Supabase Auth settings.
- On application startup, a stored Supabase session is validated against Auth; expiring tokens are refreshed and storage changes are synchronized across tabs. Customer passwords remain exclusively managed by Supabase Auth.
- The homepage shows a preview of active categories; View All Categories opens `/categories`, which displays the full active category list and counts derived from live products. Category cards open `/products?category=<category-name>`; the filter is case-insensitive, shareable and preserved across refresh/back-forward navigation.
- See `LOGIN_AND_CATEGORY_UX_UPDATE.md` for details and validation notes.


## OAuth provider and image visibility follow-up (2026-10-20)

- Supabase Auth logs from the live project showed `/settings` responding with HTTP 200 and `/authorize` redirects for Facebook, Google, and Azure (Microsoft). Those entries show OAuth initiation works; `auth.identities` still has only email identities, so a successful provider return is not verified. Provider client credentials and app-console redirect URLs remain the likely items to confirm after the redirect.
- The active database banner's desktop/mobile storage objects have identical ETag and size (369,427 bytes), indicating the same landscape creative was configured for mobile. The homepage now uses a capped, non-cropping frame, an unobtrusive blurred backdrop, and falls back to the bundled portrait-safe mobile artwork if the mobile image is landscape or fails to load.
- The navbar and account screen render the actual `company_profile.logo_url` image without switching to a different wordmark based on image dimensions. The local fallback `src/assets/logo.jpeg` is byte-for-byte identical to the active Supabase Storage logo object (its file MD5 matches the Storage ETag), and is rendered with `object-fit: contain`, no filters, no crop and no edit.
- The database banner frame follows the loaded image's natural aspect ratio. The image is contained without stretching/cropping, and Shop/WhatsApp CTA controls remain in a separate row after the full artwork in normal document flow. The CTA row cannot cover the banner's bottom edge.
- A direct `/categories` route is resolved to the category directory, not the product list.
- Validation for the last update: `npm test` reports 8 passing tests; CSS parses; TypeScript/TSX transpile syntax checks report zero errors across 64 files. `npm run build` could not run in this sandbox because `node_modules/.bin/vite` is unavailable; run `npm ci && npm run build` in the project environment.
- See `AUTH_OAUTH_AUDIT_2026-10-20.md` for live project checks and the provider-console checklist.


## Logo and complete-banner visibility correction (2026-10-20)

- `company_profile.logo_url` is the primary source for the navbar and account-page logo. Removed the previous on-load rule that replaced square database logos with a different local wordmark. The local fallback is the exact same JPEG bytes as the live Supabase Storage logo (MD5/ETag: `e4ba4e0aaed8815ff3d790e54fbb2122`).
- The source image is not altered, filtered or cropped. The square source gets a square frame so the complete mark is visible.
- `HomeBanner` now measures the loaded desktop/mobile image and applies its natural `aspect-ratio`. The action strip follows the entire image and remains in the document flow instead of covering the banner bottom.
- `npm test`: 8 passed. A full `npm run lint` / production build remains unverified here because React, Vite and several package dependencies are not installed in this workspace. Run `npm ci`, `npm run lint`, and `npm run build` before deploying.

See `LOGO_BANNER_VISIBILITY_FIX.md` for the latest logo-source verification and non-overlapping banner layout correction.

## Responsive homepage banner update (20 October 2026)

The database-driven homepage hero now uses a responsive frame sized from both the viewport width and viewport height. The full uploaded banner artwork is contained without stretching or cropping, with the blurred image backdrop filling any unused side space. The Shop Now / WhatsApp action row remains in normal document flow below the artwork and cannot cover it. On small screens, the hero uses a portrait-safe mobile image when the configured mobile upload is still landscape.

After installing project dependencies, run `npm test` to verify the banner regression checks alongside the existing tests. The complete Vite build should be run locally with `npm run build` before deployment.
