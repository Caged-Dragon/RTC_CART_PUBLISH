# Account creation and login — Supabase Auth owns identity

The customer account flow now uses Supabase Auth's server endpoints for all identity operations. The frontend does not create credentials in `public.users`, store password hashes, compare passwords, or implement its own verification rules. Passwords are sent only to Supabase Auth over HTTPS.

## Native Auth operations

- Registration: `POST /auth/v1/signup` with name/phone/city in Auth user metadata. Supabase Auth creates the identity in `auth.users`; the project's `private.handle_new_auth_user` trigger creates or links the corresponding `public.users` profile row.
- Email/password login: `POST /auth/v1/token?grant_type=password`. Supabase Auth validates credentials and returns the session.
- Email confirmation: controlled by the Supabase Auth dashboard. The app does not invent a logged-in state if Supabase returns no session.
- Password reset request: `POST /auth/v1/recover`; email-link recovery returns to `/login`.
- Password update: `PUT /auth/v1/user` using the access token from the verified Supabase recovery session.
- OAuth: redirects to Supabase Auth `/auth/v1/authorize` for Google, Apple, or Azure.
- Refresh and sign-out: refresh tokens are exchanged with Supabase Auth, and logout revokes the server-side Supabase session before clearing local session state.

The app still reads/updates `public.users` for non-secret customer profile fields (name, phone, address and city). That table is not the source of truth for passwords or authentication. The database trigger is the profile synchronization mechanism after a Supabase Auth identity is created.

## Verified against the connected project

- Project: `ypmiinmkyvzdpakbkers` (`RtCrackers Cart`)
- Live Auth users checked: 4
- Email-confirmed Auth users: 4
- Linked customer profile rows: 4
- Auth users missing a `public.users` profile: 0
- Trigger: `auth.users` INSERT -> `private.handle_new_auth_user`

An additive migration named `20261020125317_auth_profile_city_from_metadata.sql` is included and was applied to the connected Supabase project. It keeps the existing trigger and identity linkage and additionally copies `city` from signup metadata to the customer profile. No user or password data was changed by that migration.

## Required Supabase dashboard settings

1. Under **Authentication → URL Configuration**, set the Site URL to the deployed storefront origin and add each allowed redirect origin/path used for local development and production (including `/login`).
2. Under **Authentication → Providers**, enable Email. Set **Confirm email** to the desired production policy; when it is enabled, users must verify their email before password login succeeds.
3. For Google, Apple, or Microsoft sign-in, configure each provider's own OAuth credentials and callback URL in Supabase before offering that button in production.
4. In the email confirmation and password recovery templates, ensure the confirmation/recovery action uses Supabase's provided confirmation URL/token template. Do not expose a service-role key to the browser.

## Test after installing dependencies

```sh
npm ci
npm run lint
npm test
npm run build
npm run check:db
```

`check:db` is a read-only public REST smoke test. This environment had no npm registry/outbound REST network access, so a full build and end-user email/OAuth round-trip could not be executed here. Test signup with a dedicated test address, check email delivery and confirmation, sign in, request password recovery, update the password from the recovery link, and sign out before deploying.
