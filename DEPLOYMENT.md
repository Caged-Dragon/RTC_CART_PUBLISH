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
