# Catalogue upgrade notes — `cart.rtcrackers.com`

This archive contains the independent Vite/React + TypeScript catalogue and local product-shortlist application. It links back to `https://rtcrackers.com` and shares the active Supabase backend.

## Included updates

- Catalogue queries use normalized product/category/current-price/image tables from the verified shared database.
- Build-time SEO shell generation creates individual metadata for public catalogue/category/product routes and keeps account/shortlist/historical order routes non-indexable.
- Sitemap refresh reads current product serials/prices where the public Supabase API is reachable and retains the committed fallback during transient network failure.
- Current product routes reflect the 127 products in the 2026 catalogue.
- Cross-site legacy `id`, `qty`, and combo parameters are treated as catalogue search hints only; no automatic cart additions.
- The product shortlist is local/reference-only. The app does not create online fireworks orders or invoke the order-creation RPC.
- PWA install prompt and app navigation improvements are retained.

## Verified remote changes

The connected database-management interface confirmed 127 active products, 127 current 2026 price rows, 18 active categories, 3 pack types and 14 active product images. Page-specific SEO records for cart/account/history surfaces are non-indexable. Reviewed public CMS wording was updated to remove old minimum, delivery-fee and online-checkout messages. The production database schema and RLS grants were not changed.

## Validation

CART regression suite: 29 passed, 0 failed. TypeScript/TSX source transpile pass: 88 files across the two codebases, 0 syntax errors. The test suite also passes when this codebase is extracted and tested independently. npm dependency downloads and direct REST/public-domain HTTP checks are blocked by DNS/network limits in this environment; run `npm ci`, `npm run lint`, `npm test`, `npm run build`, and `npm run check:db` in network-enabled CI.

## Important caveat

This release is a catalogue/general-enquiry site only. Do not restore online fireworks checkout until qualified legal/licensing review. Production Supabase security advisor findings are documented in `CART_COMPLIANCE_REVIEW.md`.
