# RT Crackers account creation verification

## Application changes

- The header now includes a `My Orders` button beside `Cart` on desktop and mobile. It opens `/my-orders` and visually marks the route as active.
- The My Orders empty state directs signed-out customers to sign in/register, with a separate order-tracking option.
- Signup now treats a valid Supabase response with a user but no session as a pending email-confirmation flow, rather than throwing an error after account creation has been accepted. The message explains verification and remains privacy-preserving if an address is already registered.
- If signup returns a session (email confirmation disabled), the app sets the session and refreshes the customer profile immediately.

## Read-only live checks performed on 2026-10-18

- Supabase project is active/healthy.
- `auth.users`: 4 records; 4 have confirmed email addresses.
- `public.users`: 4 customer profiles; all 4 are linked to an Auth user.
- No Auth user currently lacks a linked `public.users` profile.
- An `AFTER INSERT` trigger on `auth.users` invokes `private.handle_new_auth_user()`. Its inspected definition links or creates the customer profile using the submitted `full_name` and `phone` metadata. RLS is enabled on `public.users`.
- One signup-related event in the last 24 hours was classified as `user_repeated_signup` with HTTP 200. This represents a repeated signup request; it is not evidence of a newly created account.

## What remains unverified

A fresh end-to-end signup test was not performed because no dedicated test inbox was supplied. To verify email delivery and confirmation end-to-end, register with an inbox you control, click the verification link, confirm the site returns to the storefront, and then sign in. Do not disable email confirmation merely to make the test pass.

The npm registry was unreachable during this run, so a dependency-backed TypeScript/lint check and production build could not complete. TypeScript syntax parsing passed for the edited TS/TSX files.
