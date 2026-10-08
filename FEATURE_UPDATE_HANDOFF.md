# RedThunder Feature Update Handoff

## 1. PWA install prompt
- `PwaInstallPrompt.tsx` now keeps the install action clickable even when `beforeinstallprompt` is unavailable.
- Chromium browsers with an install event show the native Install prompt.
- iOS and browsers without the event show browser-specific installation guidance.
- `appinstalled` hides the prompt after successful installation.
- `manifest.webmanifest` now includes an explicit `id`.

## 2. Intro/home combo presentation
The home/intro screen no longer renders the complete Gift Box/Combo catalogue. It shows one compact CTA teaser that links to `/gift-boxes`.
The full combo catalogue remains database-driven on the dedicated Gift Boxes screen.

## 3. Smart filtering
The catalogue now supports more than 20 practical filter choices through:
- search
- category
- 7 price bands
- pack type
- 5 piece-count bands
- availability
- 10 intent tags
- green-cracker
- bestseller
- featured
- sorting

Desktop uses a sidebar; mobile uses a filter drawer with active-filter count and reset controls.

## 4. Customer-focused homepage merchandising
The homepage Best Sellers section reads `public.homepage_customer_picks`.
This table references existing `public.products` rows and does not duplicate product data.

Editable merchandising fields include:
- display_order
- is_active
- badge_text
- customer_label
- customer_reason
- customer_score
- rating_stars
- rating_count
- admin_note

The current database has no product-level review rows, so the UI does not fabricate star ratings. Real rating values can be entered later when your product-rating model is available.

## 5. Supabase safety
The new table is additive and isolated with `website_key = 'cart'`.
Existing product, category, cart, order, checkout, auth, storage and theme tables/contracts were not changed.
Public users can read active picks. Only authenticated admins can modify them through RLS.
