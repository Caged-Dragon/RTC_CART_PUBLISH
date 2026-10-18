# RT Crackers Best Sellers update

## Customer-facing changes

- Added a dedicated, shareable `/best-sellers` route and linked it in desktop and mobile navigation.
- The Best Sellers page shows the complete shared collection with search, category filtering, and sorting by recommendation, price, or name.
- The home page uses the same list and features approximately 55% of the collection. The count is rounded to the nearest whole product, with at least one product shown when the collection is non-empty.
- The shared list combines active curated customer picks with products marked popular/best-seller in the live catalogue; duplicate products are removed.
- Product cards support add-to-cart, quantity controls, and opening product details. Product details return to the page the customer came from.
- Added responsive layouts, loading placeholders, and useful empty/filter states. Updated the service-worker cache version so a deployed update can supersede the previous cache.

## Configuration

For products to appear as best sellers, mark them as best-sellers in the existing live product catalogue or publish the curated customer-pick rows. No database schema change is required by this UI update.

## Verification note

The source was checked for TypeScript/TSX parse/transpile errors. A complete dependency-backed `npm run lint` and production build could not be run in this environment because the npm registry could not resolve (`EAI_AGAIN`). Run the following on a networked machine after extracting the project:

```sh
npm ci
npm run lint
npm run build
```
