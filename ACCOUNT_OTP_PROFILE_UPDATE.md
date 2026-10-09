# CART account, email OTP, profile and settings update

## Frontend changes
- Replaces the password-first sign-in form with email OTP login and registration.
- Adds a six-digit code field, resend-code action, validation, busy states and visible errors.
- Adds profile editing for name, phone, address, city, district, state and PIN code.
- Stores email notification preferences in authenticated Supabase user metadata.
- Adds password-recovery request, sign-out, and a typed account-deletion confirmation.

## Deploy the account deletion function
From the project root, with the Supabase CLI logged in and the project linked:

```cmd
supabase functions deploy delete-account
```

The function expects Supabase's hosted `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment variables. It verifies the caller's bearer token against Supabase Auth and only deletes that caller's own Auth user. It does not accept a user ID from the browser. Do not expose or place the service-role key in any `VITE_` variable.

## Before production release
1. Keep `.env.local` out of the uploaded source archive. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in your deployment platform's environment settings.
2. Confirm Supabase Auth email OTP is enabled and your existing Send Email Hook handles the `signup` and `magiclink`/email OTP action types.
3. Configure the site's production URL in Supabase Auth URL Configuration and allow it in Redirect URLs for provider login/recovery.
4. Test both a brand-new email and an existing account. Supabase OTP rate limits apply.
5. Test profile writes against the actual `public.users` schema and its RLS policies.
6. Test account deletion against a test account first. Foreign-key constraints, order history, and retention rules may block deletion; if so, decide on an approved anonymization/retention approach rather than deleting business records indiscriminately.
7. Build and smoke-test the app before publishing. Dependency installation was unavailable in this workspace, so this archive has not been build-verified.

## Current limitations
- Changing the login email is not wired into the UI yet because it needs a dedicated verified email-change flow.
- Notification preferences are persisted to Supabase user metadata, but email sending code must check these preferences before sending optional marketing/order notification messages.
- Social login buttons still depend on Google, Apple and Azure provider setup in Supabase Auth.


## OTP reliability fixes (follow-up)
- Sign-up OTP verification uses Supabase token type `signup`; existing-account email OTP uses `email`.
- The account screen enforces a 60-second resend cooldown and interprets Supabase HTTP 429 responses instead of encouraging repeated sends. The cooldown is a client-side guard; Supabase's server-side rate limit remains authoritative.
- The service worker now returns a valid 503 `Response` if a navigation or resource fetch fails and no cached fallback exists, avoiding `Failed to convert value to 'Response'` errors.
- A `beforeinstallprompt` console notice is separate from OTP: the custom PWA install card intentionally prevents the browser's native banner and calls `prompt()` when the user presses its Install button.


## OTP and install-banner follow-up
- The authentication screen now accepts exactly seven digits to match the code currently delivered by this project.
- Both sign-in and registration pass `type: "email"` to `/auth/v1/verify`, matching Supabase email OTP verification guidance.
- Expired/invalid OTP errors now suggest requesting a fresh code and entering all digits from the newest email.
- The PWA component no longer cancels the browser install event. Browsers can show their native install UI; browsers without that event get manual install instructions instead.
