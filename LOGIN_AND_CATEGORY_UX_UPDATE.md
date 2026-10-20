# Login and Category Navigation Update

## Login experience

- Redesigned the account screen into a responsive desktop/mobile layout with a store-benefit panel, clear mode switch, accessible inputs and clear feedback states.
- Sign-in asks for email/password only. Create-account collects full name, email, Indian mobile number, optional city, password and confirmation. It rejects mismatched passwords and invalid email/mobile input before calling Supabase.
- Password visibility controls and autocomplete semantics reduce sign-in friction; buttons show busy states and block duplicate submission.
- Recovery responses use non-enumerating wording. Supabase remains authoritative for password checks, email confirmation, password reset, password update and OAuth.
- Stored sessions are checked with Supabase Auth when the app starts. Invalid/revoked sessions are cleared after refresh fails, token refresh is scheduled before expiry and temporary network errors are handled separately from rejected sessions. Session storage changes are observed across tabs.
- OAuth options continue to be read from the Supabase Auth settings endpoint; only enabled provider buttons are rendered. Authorization uses PKCE and callback codes are exchanged by Supabase Auth.
- Public customer profile data remains in `public.users`; no password hashes or locally fabricated authenticated sessions are added.

## Category navigation

- The home page shows a concise preview of the first eight active database categories, with View All Categories opening the dedicated `/categories` directory.
- The `/categories` screen lists every active database category, supports searching the directory, shows counts derived from live catalogue products, and navigates to `/products?category=...` when a card is selected. The desktop Categories nav label and the mobile bottom Categories shortcut open this directory; the desktop adjacent chevron retains quick category filters.
- Product counts are derived by matching active catalogue product categories to each live `product_categories.category_name`.
- Image selection remains database-first (category image, then a product image in that category, then bundled fallback artwork).
- A category tile stores a shop intent before navigation to avoid an event-order race.
- The shop reads `?category=` on first render, filters product categories case-insensitively, writes the current filter to the URL and syncs filter state on browser back/forward events. The URL preserves unrelated query parameters.

## Verification performed

- `npm test`: **passed (6 tests)**, including OAuth/Auth API regressions, the SWR cache regression and category URL behavior tests.
- TypeScript/JSX parse check: **65 files, zero syntax diagnostics**. CSS parse: **passed**.
- `npm run lint`: could not complete because dependency installation was interrupted and type definition packages were unavailable.
- `npm run build`: could not complete because Vite was not installed after the interrupted dependency install.
- The environment blocked dependency installation through a transport timeout; `npm run lint` is still blocked by missing TypeScript definition packages and `npm run build` by missing Vite. Run the full install/build commands from a machine with package-registry access before deploying.

## Setup

1. Extract this project.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Run `npm ci`, `npm test`, `npm run lint`, `npm run build` and `npm run dev`.
4. Test password login, email-confirmation signup, forgot password, reset-password callback, every enabled OAuth provider and category links in the browser.

No production database schema or catalogue records were modified by this frontend update.
