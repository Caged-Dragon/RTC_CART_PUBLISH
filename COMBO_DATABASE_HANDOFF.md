# RedThunder Combo Database Handoff

## Architecture
The combo catalogue uses a normalized master/detail model:

- `public.combo_packs` — one row per combo, including identity, marketing copy, budget tier, active/featured state, display order and pricing mode.
- `public.combo_pack_items` — the product composition for each combo, including the linked live product, quantity, order and presentation notes.
- `public.combo_pack_catalogue` — security-invoker read view returning each active combo with live product details and a calculated price.

This deliberately avoids creating 20–30 physical SQL tables, one per combo. Every combo is still an independent record with its own complete product/detail list, while the schema stays normalized and maintainable.

## Current live data
- 24 active combo masters
- 8 featured combo masters
- 0 orphan combo-item references
- 0 duplicate `(combo_id, product_id)` lines
- Every active combo resolves to active live products

## Pricing
Combos default to `LIVE_SUM`: the catalogue price is calculated from the current `products.factory_rate` multiplied by each combo line quantity. `MANUAL` pricing is supported by the schema but should only be enabled once the checkout/order contract has been extended to explicitly honor a bundle price.

The existing order RPC accepts product IDs and quantities and recalculates prices from the live `products` rows. For that reason, the frontend expands a combo into its component products when adding to the cart. Existing cart and checkout business logic remains unchanged.

## Public/admin access
Customers can read active `cart` combos and their component lines. Combo writes are restricted to authenticated admins through `private.is_admin()`. Both tables are RLS-enabled and constrained to `website_key = 'cart'`.

## Storefront behavior
- Homepage shows only a compact combo teaser; it does not dump the whole combo catalogue into the intro experience.
- `/combos` shows the complete database-managed combo catalogue.
- `/gift-boxes` remains a separate screen for the existing Gift Box product category.
- A combo containing any `OUT_OF_STOCK` component is shown as temporarily unavailable and cannot be partially added to the cart.
