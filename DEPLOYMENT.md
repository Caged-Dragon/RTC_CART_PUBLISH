# RT Crackers split deployment

## Customer
Deploy `/cart` as a Vercel project.
- Domain: `cart.rtcrackers.com`
- Build command: `npm run build`
- Output: `dist`
- Environment:
  - `VITE_SUPABASE_URL=https://ypmiinmkyvzdpakbkers.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>`

## Admin
Deploy `/admin` as a separate Vercel project.
- Domain: `admin.rtcrackers.com`
- Build command: `npm run build`
- Output: `dist`
- Same Supabase environment variables.

The admin app shows its login screen before any admin UI. Supabase Auth verifies the password, then `public.admin_access` verifies that the signed-in email is one of the two allowlisted administrator IDs.

Authorized IDs:
- `developer@rtcrackers.com` — Primary Admin
- `admin@rtcrackers.com` — Admin

If these two email identities do not yet exist in Supabase Auth, create them in Authentication > Users and set their passwords there. The split does not invent or expose passwords.

## Company editor
The admin Company Control screen updates `public.company_profile`. The customer website reads that row at runtime. Logo changes are made through the `logo_url` field using a public HTTPS image URL.

## After deploying
1. Run `supabase/migrations/20261007_order_rules_and_policy_cleanup.sql` in the Supabase SQL editor (reviewed; adds server-side minimum-order / season checks).
2. Supabase dashboard > Authentication > Passwords: enable **Leaked password protection**.
3. Open the site once on a phone: the browser should offer **Install app** (icons + service worker are now valid).

## Transactional customer emails

The cart now sends transactional emails through the Supabase Edge Function `transactional-email` and Resend. The function selects the sender dynamically from `public.business_email_addresses` by `public.business_email_purposes` and writes delivery records to `email_messages` / `email_recipients`.

Set these Edge Function secrets in Supabase (Dashboard → Edge Functions → Secrets):
- `RESEND_API_KEY` — your Resend API key
- `SEND_EMAIL_HOOK_SECRET` — the secret generated when configuring the Supabase Auth **Send Email** hook

Then configure Authentication → Hooks → **Send Email** to call:
`https://ypmiinmkyvzdpakbkers.supabase.co/functions/v1/transactional-email`

The hook must be enabled after the function is deployed. With the hook enabled, Supabase Auth sends signup verification, password reset, magic-link and related auth emails through this function, which uses the `account` business email purpose. Order confirmations use the `orders` purpose; quotations use `sales`.

Do not expose `RESEND_API_KEY`, `SUPABASE_SECRET_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` in Vite `VITE_*` variables.

## CSS `text/html` / missing hashed asset recovery

If the browser console says it refused to apply `/assets/index-<hash>.css` because the response MIME type is `text/html`, the requested CSS URL is receiving an HTML fallback instead of the generated stylesheet. This is not a CSS styling rule error; it usually means the deployed `index.html` and `dist/assets` came from different builds, an old HTML response is cached, or the generated asset was not uploaded.

This project now:
- avoids a catch-all Vercel rewrite that can turn a missing `/assets/*.css` or `.js` request into `index.html`;
- rewrites only the real client-side routes to `/index.html`;
- sets `Cache-Control: no-cache, no-store, must-revalidate` on `/`, `/index.html`, and `/sw.js`;
- versions the service-worker cache and verifies MIME types before caching hashed assets; and
- allows the browser's native PWA install prompt to work without cancelling `beforeinstallprompt` and leaving it unshown.

### Required redeploy procedure

1. Deploy the **source project through Vercel's build pipeline**, with Build Command `npm run build` and Output Directory `dist`. Do not upload only `index.html` or mix `index.html` from one build with an `assets/` folder from another.
2. Confirm the deployment output contains `dist/index.html` and every generated file referenced in `dist/index.html` under `dist/assets/`.
3. Redeploy the complete build as one release.
4. In a test browser, unregister the previous service worker from DevTools → Application → Service Workers, clear site data once, then hard-reload. The new `rt-crackers-cart-v5-asset-mime-fix` service worker will clear the older cache on activation.
5. Check Network → the `index-*.css` request. It must return `200` with a `Content-Type` beginning `text/css`, not `text/html`.

If the CSS is still missing after a clean redeploy, inspect the built `dist/index.html` asset name and confirm the exact file exists in `dist/assets/`. Do not manually edit the generated hash in `index.html`; Vite computes it during every production build.
