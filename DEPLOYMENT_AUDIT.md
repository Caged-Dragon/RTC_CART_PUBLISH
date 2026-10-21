# CART website — deployment and backend audit

Canonical domain: `https://cart.rtcrackers.com`

## Shared backend

This independent Vite/React project uses the active `RTCrackers` Supabase project `hhbpyxhtksgbkaigeutl` (region `ap-south-1`) shared with `rtcrackers.com`. Management-channel checks verified the current public schema, table read grants and row-level security policies for the catalogue and public CMS tables. The current schema contains 127 active products, 127 current 2026 pricing rows, 18 active categories, 3 pack types and 14 product-image records. Current catalogue pricing observed at audit time was ₹21–₹5,000.

The live public CMS now contains page-specific SEO records for the five cart/order/account routes (IDs 12–16), with `noindex` so private and historical-account paths do not target search traffic. Stale checkout/order copy was removed from the relevant active public CMS sections.

## Build and test

```sh
cp .env.example .env.local
npm ci
npm test
npm run lint
npm run build
```

The local regression suite passed **29/29** tests. A global TypeScript transpile pass parsed 88 source TypeScript/TSX files across both projects with no syntax diagnostics. The dependency-backed `npm run lint` and `npm run build` could not be completed in the supplied runtime because npm dependency downloads failed with DNS/network errors. The build scripts are included and are ready to run in a network-enabled CI environment.

## Runtime HTTP verification limitations

The container could not resolve the public Supabase REST hostname or either configured website domain, so public REST/API response testing and remote website status checks could not be completed here. Database metadata and table grants were verified via the connected Supabase management connection. After deployment, run `npm run check:db` from a network-enabled environment; it performs read-only public API checks and never prints the publishable key.

## Transaction status and compliance

This release is catalogue/general-enquiry only. It does not submit online fireworks orders or online payments. The local shortlist is informational. Do not restore digital order submission without a qualified review of the applicable laws and licensing requirements.

## SEO

See `SEO_KEYWORD_MAP.md`. Build-time SEO shell generation creates unique title, description, canonical, robots, Open Graph, Twitter and schema metadata for public routes and product pages. Cart/account/historical records remain non-indexable. Search position is never guaranteed; validate both domains using Google Search Console after release.

## Production database advisories

The current Supabase advisor still reports public execution grants on `SECURITY DEFINER` functions, four RLS-enabled tables without explicit policies, and mutable `search_path` on a number of functions. These were not auto-modified because their intended callers/workflows must first be reviewed. See root `CART_COMPLIANCE_REVIEW.md` in the full working folder for detail.
