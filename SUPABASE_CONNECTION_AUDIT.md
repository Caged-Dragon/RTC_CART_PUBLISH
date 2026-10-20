# CART Supabase connection and homepage data audit

Audit date: 2026-10-20

## Project identity

- Name returned by the Supabase management connection: `RtCrackers Cart`
- Project reference: `ypmiinmkyvzdpakbkers`
- Region: `ap-south-1`
- Management status: `ACTIVE_HEALTHY`
- The original CART archive's Vite environment values were checked locally and the project URL reference matches the connected project. The public publishable key was also matched against the project's enabled publishable-key record without printing it into the handoff.

## Live database read observations

Read-only SQL queries ran successfully against the matched project:

| Data source | Live result |
|---|---:|
| Active `products` | 127 rows |
| Active `product_categories` | 18 rows |
| Active cart `homepage_customer_picks` | 10 rows |
| Active cart `combo_packs` / `combo_pack_catalogue` | 24 rows |
| Featured active combo packs | 8 rows |
| Active `offers` | 1 row |
| Active `offer_banners` | 1 row |
| Active `company_profile` | 1 row |
| `merchant_settings` | 1 row |
| Active cart `theme_page_settings` rows | 13 rows |

Data integrity spot checks:

- All 10 active curated homepage picks join to active products; none is missing or out of stock.
- Active products have matching active category names in the category table.
- All 24 active combo catalogue entries have item data (no empty combos).
- The single active banner has both desktop and mobile image URLs.
- 60 of 127 active products have a URL in `image_url` or `product_image`.
- No active product category currently has `product_categories.image_url`; no active combo currently has `combo_packs.image_url`.

## Public access checks

The management SQL inspection found public/anon SELECT privileges and active-row RLS SELECT policies for the relevant homepage data sources (`products`, `product_categories`, `homepage_customer_picks`, `combo_pack_catalogue`, `offers`, `offer_banners`, `company_profile`, `merchant_settings`, `theme_page_settings`). Public/anon INSERT privilege was not granted on these checked objects. Writes are restricted to the appropriate authenticated/admin policies or existing secure order flows.

## Frontend mapping applied

- Product catalogue, displayed product rates, stock states and product image fields: `public.products` through `ProductsContext`.
- Homepage category name/order/image fields: `public.product_categories`; image fallback is used only because all live category image URL fields are empty.
- Best-seller/homepage picks: `public.homepage_customer_picks` joined by the real `product_id` UUID.
- Combo names, tier, display order, featured flag, item composition and calculated price: `public.combo_pack_catalogue`, whose view resolves active products and factory-rate pricing in the database.
- Hero banner: `public.offer_banners` and its related active `offers` row, with responsive image URLs from the DB; local reference hero assets are a fallback if there is no usable live banner.
- Store branding and order configuration: `public.company_profile` and `public.merchant_settings`.
- Theme tokens: `public.theme_page_settings`, filtered by `website_key=cart` and page key.
- Image handling: product DB URLs have priority; bundled imagery handles absent/failed URLs.
- WhatsApp order copy uses the loaded store name/contact/location where supplied instead of assuming a fixed Sivakasi address in the formatter.

## Validation limitations and safety

- Existing `npm test` (SWR cache regression test) passed in the handoff runtime.
- `npm run check:db` was added as a local, read-only smoke test for nine public REST endpoints. Running it inside this sandbox failed for all endpoints because outbound HTTP fetches are blocked/unavailable in this environment; it did not receive an HTTP auth/policy error. Run it on your own machine to test real browser/API network access.
- `npm run lint` / Vite build could not be fully validated because dependencies were not installed in this sandbox; invoking global TypeScript showed unresolved dependency/type declarations (React, lucide-react, etc.). Run `npm ci`, `npm run lint`, and `npm run build` locally.
- No SQL `INSERT`, `UPDATE`, `DELETE`, DDL, or migration was applied to the live project. Existing schema and merchandising records are sufficient for the database-driven content update; shared tables were intentionally not mutated merely to populate optional image URLs.

## Local check

```bash
npm ci
npm run check:db
npm run lint
npm test
npm run build
npm run dev
```
