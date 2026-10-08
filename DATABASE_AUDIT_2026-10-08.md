# RedThunder Supabase Database Audit — 2026-10-08

## Audit scope
Read-only inspection of the existing live schema/data followed by additive creation of the combo subsystem. Existing product/order/auth/cart/theme/mail/transport/offer contracts were preserved.

## Inventory after additive combo deployment
- Public tables: **33**
- Public tables with RLS enabled: **33/33**
- Private tables: **1** (`private.admin_accounts`)
- Deployed Edge Functions: **0**
- Products: **127**, all currently active
- Product categories: **18**
- Gift Box products: **10**
- Transporters: **5** active
- Freight rate rows: **0**
- Reviews: **0**
- Theme pages: **22** across website keys `admin`, `cart`, `mail`, `main`
- Theme components: **143** across those website keys
- Active `cart` theme pages: **13**
- Active `cart` theme components: **64**

## Public table inventory
`public.admin_access`, `public.admin_log`, `public.business_email_addresses`, `public.business_email_purposes`, `public.combo_pack_items`, `public.combo_packs`, `public.company_profile`, `public.customer_log`, `public.email_messages`, `public.email_recipients`, `public.freight_rates`, `public.homepage_customer_picks`, `public.mail_notification_preferences`, `public.mail_notifications`, `public.mailbox_access`, `public.mailboxes`, `public.merchant_settings`, `public.offer_banners`, `public.offer_categories`, `public.offer_products`, `public.offer_usage`, `public.offers`, `public.order_items`, `public.order_tracking`, `public.orders`, `public.product_categories`, `public.products`, `public.reviews`, `public.theme_component_settings`, `public.theme_page_settings`, `public.transporters`, `public.user_password_history`, `public.users`.

## Commerce integrity checks
- Negative prices: **0**
- MRP below factory rate: **0**
- Orphaned `products.category_id`: **0**
- `OUT_OF_STOCK` products with positive quantity: **0**
- Active products with `available_quantity = 0`: **127**

### Inventory caveat
All 127 active products currently have `available_quantity = 0` while `stock_status` remains availability-bearing. This was deliberately not changed. The existing `private.create_order` / `create_order_v2` path validates `stock_status` and uses the database `factory_rate`; changing quantity semantics on a live shared database requires a business decision.

## Security review
- All 33 public tables have RLS enabled.
- `private.admin_accounts` is protected by a client-deny policy.
- Administrative writes generally use `private.is_admin()`.
- The order creation path is behind a private SECURITY DEFINER implementation and performs server-side product validation/pricing.
- The customer review submission path is behind a private SECURITY DEFINER implementation and checks customer/order ownership and rating bounds.
- No Edge Functions are deployed.

## Automation / triggers
Observed updated-at triggers cover company profile, freight rates, merchant settings, offers, offer banners, orders, products, theme settings, transporters and users. A category synchronization trigger maintains `products.category` from normalized categories.

## Offers / logistics
- One active custom offer/banner record exists.
- `freight_rates` currently contains **0** rows while 5 transporters are active; a production freight estimator therefore needs rate data before it can calculate charges.

## Combo subsystem — additive only
Migration: `20261008171802_create_combo_master_and_detail_catalogue`

Added:
- `public.combo_packs`
- `public.combo_pack_items`
- `public.combo_pack_catalogue`
- `public.set_combo_updated_at()`

Validation:
- Combo masters: **24**
- Active combos: **24**
- Featured combos: **8**
- Orphan combo items: **0**
- Duplicate combo/product lines: **0**
- All active combos have active product detail lines: **verified**

## Existing production structures intentionally not modified
- `public.products`
- `public.product_categories`
- `public.orders`
- `public.order_items`
- `public.order_tracking`
- `public.users`
- `public.reviews`
- existing offer tables
- existing theme tables
- existing mail tables
- private authentication/admin functions
- existing checkout/order RPC contracts
- storage configuration
- deployed Edge Functions (none)

## Recommended future work
1. Populate `freight_rates` before exposing exact freight estimates.
2. Connect genuine per-product review aggregates before displaying star ratings as customer evidence.
3. Add an admin merchandising editor for `combo_packs` and `combo_pack_items`.
4. Extend the order RPC only when a true bundle-level discount/price is required; do not display a discount that checkout cannot honor.
