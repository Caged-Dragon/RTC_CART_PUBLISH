# RedThunder Cart — Peak Conversion Upgrade

## What changed
- Database-driven combo/gift-box display: the UI reads existing live products whose category/name identifies them as Gift Box/Combo products. No frontend combo records or prices are hardcoded.
- Cart value panel: varieties, units, live catalogue savings, and cart value.
- Minimum-order progress and clear checkout-readiness messaging using existing merchant configuration.
- Smart cart recommendations selected from the existing live product catalogue; one-click Add uses the existing CartContext.
- Live stock messaging for low-stock products.
- Product-image shortcut from cart back to the catalogue.
- Mobile sticky Confirm Order bar with safe-area support.
- Stronger cart drawer with minimum-order progress, savings, and recommendations.
- Persistent mini-cart bar on non-cart pages (desktop/tablet) to reduce abandonment.
- Existing checkout/order/WhatsApp/invoice logic preserved.

## Combo data contract
The supplied repository contains no separate `combo_packs`/`bundles` table in its SQL schema. Gift-box/combo packs are represented by product records in the existing `products` catalogue (the provided catalogue seed contains Gift Boxes records such as Red Rose, Lilly, Poppy, Lotus, Tulip, Jasmine, Marry Gold, Sun flower, Blue Bell and Lavender Special).

The frontend now treats the live catalogue as the authority. If the production `products` table contains 20–30 combo/gift-box records, all published/in-stock records matching the supported category/name patterns will appear automatically. The frontend does not create, update, or delete those records.

## Supabase safety
No database migration, table, column, RLS policy, storage bucket, edge function, RPC, authentication contract, or API contract was changed by this cart pass.

## Verification
- TypeScript compilation: PASS using the supplied project dependency tree.
- Protected Supabase files: unchanged by SHA-256 comparison.
- Production Vite build: not executable in this container because the supplied environment is missing the Rolldown native binding for Linux. Run `npm install` and `npm run build` locally.
