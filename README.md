# RedThunder Storefront Catalogue — `cart.rtcrackers.com`

This independent Vite/React + TypeScript source tree is the companion product catalogue and local product-shortlist experience. It uses the same Supabase project as `rtcrackers.com`.

## Local development

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Validation commands after dependencies are installed:

```bash
npm test
npm run lint
npm run build
```

`npm run build` refreshes the public sitemap from active products and current price rows when Supabase is reachable, runs Vite, then creates static HTML head shells with unique title, description, canonical, robots, Open Graph/Twitter and schema metadata for each public route and product URL. If the database is temporarily unreachable, the sitemap generator keeps the committed sitemap and the SEO shell generator emits generic safe metadata for existing product paths rather than blocking the build. `npm run seo:sitemap` runs only the sitemap refresh. Deploy this directory as a separate Vercel project, attach `cart.rtcrackers.com`, and set the variables from `.env.example`.

## Environment variables

- `VITE_SUPABASE_URL=https://hhbpyxhtksgbkaigeutl.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=...`

These are public browser variables; the publishable key is not a service-role key. Do not put a secret/service-role key in `VITE_*` or ship it to browsers. Access control must continue to be enforced with Supabase RLS and server-side authorization.

## Shared database integration

Catalogue names/IDs come from `products`; current rates come from `product_prices`; category labels come from `product_categories`; pack formats come from `product_pack_types`; images come from `product_images`; and optional stock metadata comes from `product_inventory`. The app reads `app_sites`, `web_media`, `web_settings`, and `web_themes` for site branding/configuration. The legacy `rt_cart_products` table is only used for popularity/featured flags when the serial and product name match the normalized product. It is not trusted for price or primary product identity.

The live schema check found 127 active products with serial numbers 1–127, 127 current 2026 price rows, and 18 active categories. Read-only smoke checks now target this same project and the current normalized schema.

## SEO/crawling

- `index.html` contains the main catalogue head, cross-domain Organization/LocalBusiness JSON-LD, social-share metadata, viewport and manifest links.
- `scripts/prerender-seo.mjs` writes page-specific head metadata into built HTML route shells, including database-enriched product titles and `Product` schema without online `Offer` markup.
- `src/App.tsx` synchronizes title, description, keyword list, canonical, robots, Open Graph and Twitter metadata as users navigate within the client app. Account, cart/shortlist, historical order and tracking screens are marked non-indexable.
- `public/sitemap.xml` contains public informational/catalogue routes plus verified product-detail routes; `scripts/generate-sitemap.mjs` keeps product paths synced at build time. Account, shortlist, tracking, enquiry and historical order paths are excluded.
- `public/robots.txt` references that sitemap and excludes private/non-indexable paths from crawl discovery. Robots.txt is not an access-control mechanism.
- Consult `SEO_KEYWORD_MAP.md` for the per-page keyword/intent plan. Use Google Search Console after deployment; no ranking position can be promised.

## Catalogue/enquiry-only behavior

The product list and local shortlist are for information/reference only. `placeOrder()` intentionally does not create a new order or invoke an order-creation RPC, and WhatsApp links are for general product enquiries only. This project does not accept online fireworks orders or online payments. Historical order/account screens, where enabled by authentication, refer to existing database records only.

The official PESO circular on online fireworks sales should be reviewed with qualified counsel and the relevant licensing authority before restoring a digital order-submission flow.

## SQL/reference files

`supabase/review_only_not_for_db_push/` and `supabase/legacy_reference_not_for_current_schema/` retain earlier SQL scripts. They were moved out of Supabase's normal `migrations/` directory because their local versions/table assumptions do not match the verified remote schema/migration history. Do not apply them without reviewing the remote migration list, SQL grants, policies and object dependencies. No DDL/order-RPC change was applied as part of this update.
