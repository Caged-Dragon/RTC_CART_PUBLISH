# RedThunder compliance, backend and deployment review

## Current website behavior

Both public sites use the `RTCrackers` Supabase project (`hhbpyxhtksgbkaigeutl`) and its verified current schema. The showcase links to the storefront catalogue, and the storefront footer links back to the showcase. Product links pass only a search/category hint; they do not add products or submit orders. The CART `placeOrder()` call throws intentionally instead of calling an order-creation RPC. WhatsApp links open a general product-information conversation without customer/order payload.

The website is catalogue/enquiry-only. No online fireworks order or online payment is submitted. The ₹3,000 minimum and COD terms are described as stated business terms for legally permitted offline arrangements, subject to serviceability and current legal requirements. The stated policy is no cancellation and no return after verification and Sivakasi-godown dispatch.

## Live schema/data checks performed

- Shared Supabase project is active and defines `app_sites` records for `rtcrackers.com` (`portfolio`) and `cart.rtcrackers.com` (`cart`).
- Public read policies exist for the normalized catalogue and required CMS tables.
- Catalogue counts verified through the database-management connection: 127 active products, 127 current 2026 price rows, 18 active categories, 3 pack types, and 14 product-image records. Current price range: ₹21–₹5,000. The `rt_cart_products` mirror has three product-name mismatches; the updated clients use it only for merchandising flags if names match, not for current pricing.
- Page-specific `web_seo` records were written/updated live for public page IDs 1–6 (showcase) and IDs 12–16 (cart/checkout/historical account routes); transaction/account routes have `robots_index=false`. `web_pages` titles/descriptions and legacy `web_page_sections` copy were updated to remove the obsolete ₹2,000 minimum and old online-order/COD checkout claims.
- No DDL, table creation, public-RPC grant change, or order-RPC migration was applied. Local pending/legacy SQL was moved out of the automatic migration directory so it cannot be accidentally pushed with an ordinary `supabase db push`.

## Remaining backend security advisories

Supabase's project advisor returned warnings that require an administrator/security review; no grants/policies were altered automatically:

- Public (`anon`) execution is currently flagged for `public.is_primary_admin(uuid)`, `public.mark_abandoned_carts()`, and `public.set_order_status(text, order_status, text)` as `SECURITY DEFINER` functions. Check `EXECUTE` grants and authorization logic to ensure they are not callable by unintended roles.
- Four tables have RLS enabled but no policies: `abandoned_cart_events`, `customer_wishlist_items`, `customer_wishlists`, and `inventory_reservations`. This usually blocks all API access but may break intended customer workflows; assess the intended access model before adding policies.
- The advisor flagged 22 functions with mutable `search_path`; review them using pinned schemas and qualified object names. Do not bulk-change function definitions without testing dependencies.

Reference remediation guide: https://supabase.com/docs/guides/database/database-linter. These are live findings, not claims that the website source alone has fixed them.

## Legal note

PESO's circular published 11 April 2023 describes the prohibition on online fireworks sales/orders under the Supreme Court order it cites and warns of serious licensing consequences. Review the official document and obtain qualified Indian legal/licensing advice before restoring online order capture or advertising digital order-taking: https://peso.gov.in/sites/default/files/2023-04/ban%20on%20online%20sale%20of%20fw.pdf.

## Verification limits

The shared database schema, policies, catalogue counts, SEO rows and CMS copy were queried using the connected Supabase management interface. The container could not resolve the project's public REST hostname (`curl: Could not resolve host`), and dependency installation was blocked by network/DNS; therefore a direct browser REST request and both production builds were not verified in this environment. Run `npm ci`, `npm test`, `npm run lint` and `npm run build` in a network-enabled CI/deployment environment, then smoke-test both configured domains.

SEO metadata, canonicals, sitemaps and relevant content improve eligibility/discovery but cannot guarantee a first Google position.
