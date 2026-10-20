# OAuth and account-mobile audit — 2026-10-20

## Verified against live Supabase project

Project: `ypmiinmkyvzdpakbkers` (`RtCrackers Cart`).

- Supabase Auth `/settings` requests returned HTTP 200 during observed sign-in attempts.
- Auth logs recorded `/authorize` 302 redirects for `facebook`, `google`, and `azure` (Microsoft).
- `auth.identities` currently contains only two `email` identities; there are no completed Facebook, Google, or Azure identities yet. This means provider initiation is reaching Supabase, but successful provider return/exchange is not yet proven.
- The Supabase management SQL surface does not expose the built-in provider Client IDs/secrets from project Auth configuration. Those values must be checked in Dashboard / provider consoles, not in normal application tables.
- Active admin allowlist entries: 2. Active business-mail addresses: 10.
- Admin user profiles with `phone` or `phone_number` populated: 0 after cleanup.
- Business-mail-linked user profiles with `phone` or `phone_number` populated: 0 after cleanup.
- Public company contact details (for example `company_profile.mobile` / WhatsApp contact) were not changed; these are store contact details, not admin/customer login-profile mobile fields.

## OAuth app changes

The login UI still discovers enabled providers from `/auth/v1/settings` and uses Supabase Auth's PKCE code flow. It now requests explicit identity scopes:

- Google: `openid email profile`
- Facebook: `email`
- Microsoft / Azure: `email` (required for the documented Azure flow)

Provider callback errors now produce more actionable messages. Tests validate the provider scopes and PKCE exchange.

## Provider configuration checklist

Open the Supabase Dashboard for this project → **Authentication → Sign In / Providers** and confirm each provider is enabled and its Client ID/Secret matches the relevant provider app.

For Google, Facebook, and Microsoft, the provider's OAuth callback/redirect URI must point to:

`https://ypmiinmkyvzdpakbkers.supabase.co/auth/v1/callback`

Separately, in Supabase **Authentication → URL Configuration**, allow the website return URLs actually used by deployment and development, including:

- `https://cart.rtcrackers.com/login`
- `http://localhost:5173/login` (Vite development)
- `http://localhost:3000/login` (only if used)

For Facebook, ensure the app grants the `email` permission and is in Live mode or includes the test user. For Azure, ensure the Microsoft app's Web redirect URI exactly matches the Supabase callback URI. For Google, ensure the OAuth client is a Web application, its authorized JavaScript origin includes the deployed site, and its authorized redirect URI is the Supabase callback.

The sign-in logs show Supabase is redirecting to providers. Since no corresponding social identity exists yet, the remaining live verification is to finish a real sign-in and confirm it returns from the provider. Provider-console credentials/mode and callback URI settings cannot be inferred just from the application's database tables.


## Banner and logo visibility follow-up

- The active `offer_banners` desktop and mobile URLs reference two storage objects with the same ETag and content length (369,427 bytes), i.e. the same uploaded landscape artwork. It should not be scaled as if it were a purpose-built portrait mobile banner.
- The homepage now constrains the full banner artwork to a responsive frame and uses `object-fit: contain`; a blurred backdrop fills the sides without cropping or stretching the actual artwork. If the mobile URL resolves to a landscape image, the frontend uses the packaged portrait-safe banner on narrow screens. Image-load failure also falls back locally.
- The navbar/account logo uses a wide frame with `object-fit: contain` and a bundled full-wordmark fallback so it is not cropped by the old square-logo CSS.
- Validation: `npm test` passes all eight tests; PostCSS stylesheet parsing passes; TypeScript/TSX transpile syntax check passes for all 64 source files. A full Vite build could not be run because `node_modules/.bin/vite` is missing in this workspace; install dependencies and run `npm ci && npm run build` locally.
