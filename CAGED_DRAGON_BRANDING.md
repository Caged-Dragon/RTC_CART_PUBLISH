# Caged Dragon Branding

The Caged Dragon studio advertisement is intentionally frontend-owned and does not depend on Supabase data or theme settings.

## Asset
- `src/assets/cageddragon_logo.png` — original supplied logo asset.
- `src/assets/cageddragon_logo.webp` — optimized WebP used by the storefront.

## Component
- `src/components/CagedDragonAd.tsx`

The component imports the local logo and is mounted globally from `src/App.tsx`.

## Responsive behavior
- Desktop/tablet: fixed lower-right studio credit.
- Mobile: fixed above the mobile bottom navigation, with safe-area support.
- The close button only hides the ad for the current page session; no database state is written.

## Supabase safety
No Supabase table, column, policy, query, migration, storage bucket, authentication flow, or API contract is changed by this branding feature.
