# Final Cart Handoff

## Caged Dragon branding
The studio credit is intentionally compact and frontend-owned. It is hidden on the Cart screen so it cannot obstruct checkout or compete with the sticky mobile checkout action. It can be dismissed for the current session.

## Combo source of truth
Combos are no longer inferred only from the Gift Box category. The storefront reads `combo_pack_catalogue`, which resolves `combo_packs` + `combo_pack_items` against live `products`.

Adding a combo expands its component lines through the existing `CartContext` so the existing product-based order RPC continues to work unchanged.

## Final verification
- `npm run lint`: PASS.
- Vite production bundle: not completed in this environment because the available Rolldown optional native binding is missing. No source change was made to bypass or weaken the production toolchain.
