# Fixes applied to the RT Crackers cart

## What changed

- Updated Supabase request headers for modern `sb_publishable_...` keys: the publishable key is sent through `apikey`; `Authorization` carries a signed-in user's access token (legacy JWT anon keys remain supported).
- Added clearer Supabase configuration, connection, password sign-in, email-confirmation, rate-limit, and service-unavailable messages.
- Fixed customer profile refresh immediately after sign-in, and kept the account UI signed in when the profile lookup is unavailable.
- Prevented duplicate sign-in/register submissions and made authentication errors visually distinct from success messages.
- Improved the service worker's `/login` fallback, replaced the synthetic `504 Offline` response with a clearer `503 Offline`, versioned the cache, and removed the duplicate service-worker registration.

## Messages that are not application failures

- `Images loaded lazily and replaced with placeholders`: browser performance intervention; it is informational and does not indicate a broken image by itself.
- `Banner not shown: beforeinstallpromptevent.preventDefault() called`: expected when the app intercepts the PWA install event to display its own install UI. The saved event's `prompt()` is invoked only after the visitor presses Install.

## Before deploying

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment environment (Vercel → Project Settings → Environment Variables). Use the publishable key from the same Supabase project; do not use a Supabase secret/service-role key in the browser.
2. Rebuild and redeploy from the project source with `npm install`, `npm run lint`, and `npm run build`.
3. After deployment, open the site while online and reload once so the browser installs the updated service worker.

A Supabase `400` can still be correct behavior if the supplied email/password are invalid or the account has not been verified. The UI now reports those cases more clearly. The Supabase endpoint could not be checked from this environment because the project hostname did not resolve here, so live authentication still needs verification against the actual project.
