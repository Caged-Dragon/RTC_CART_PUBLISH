# Final Supabase Database Audit — 2026-10-08

## Scope
Audited the live project before and after the additive combo/cart merchandising work. No destructive changes, table rewrites, existing RPC changes, authentication changes, storage changes, or existing product/order schema changes were made.

## Current public schema
- 33 public tables; all are RLS-enabled.
- 1 private table: `private.admin_accounts`; client access is denied by policy.
- 0 deployed Edge Functions.
- 40+ migrations in the project history, including the additive combo and homepage-merchandising migrations.

## Commerce data
- `products`: 127 active catalogue products.
- `product_categories`: 18 active catalogue categories.
- `orders` / `order_items` / `order_tracking`: existing order lifecycle retained.
- 5 active transporters.
- `freight_rates`: currently empty; freight remains a separate operational confirmation step.

## Data-integrity checks
- Negative product prices: 0.
- MRP below factory rate: 0.
- Orphan product -> category references: 0.
- Combo items with missing products: 0.
- Duplicate product lines within a combo: 0.
- All active combo product references point to active product records.

## Combo architecture
### `public.combo_packs`
Master list of independently managed combos.

### `public.combo_pack_items`
Per-combo product composition, quantities, display order and item notes.

### `public.combo_pack_catalogue`
Read-only API view used by the frontend. It calculates live combo value from `products.factory_rate` and exposes the resolved product list.

Current live values:
- 24 active combos.
- 8 featured combos.
- Every combo has valid component product rows.

RLS:
- Public/anonymous users can read active `cart` combos only.
- Admin users can manage combo masters/details through `private.is_admin()` and `website_key = 'cart'` scope.

## Homepage merchandising
`public.homepage_customer_picks` is an isolated storefront configuration table referencing existing products. It currently contains 10 active picks. Admins can change display order, active state, labels, customer rationale, score and future real rating fields without changing `products`.

An automatic `updated_at` trigger is now attached to this table.

## Important existing data observation
All 127 active products currently have `available_quantity = 0` while their `stock_status` remains the availability signal consumed by the existing order function. This was intentionally not changed because converting zero quantity into hard out-of-stock semantics would alter live ordering behavior.

## Security / RPC audit
Sensitive commerce operations remain behind the existing private SECURITY DEFINER functions, including `private.create_order_v2`, `private.is_admin`, `private.get_guest_order`, and `private.submit_customer_review`. Public wrappers remain unchanged.

## Existing live-site protection
The new combo and homepage-pick objects are explicitly scoped to `website_key = 'cart'`. Existing product, order, auth and theme contracts were preserved.
