# OAuth login integration

The login page now asks the project's Supabase Auth settings endpoint (`/auth/v1/settings`) which built-in external providers are enabled. It renders only providers marked enabled in that response. The supported UI list includes Google, Apple, Microsoft/Azure, GitHub, GitLab, Discord, Facebook and other common Supabase Auth providers; disabled providers are not shown or allowed through the login handler.

## Flow

1. The browser reads provider flags from Supabase Auth settings. Provider client secrets are never sent to the browser.
2. A user selects an enabled provider.
3. The app creates a PKCE verifier/challenge pair and redirects to Supabase Auth's provider authorization endpoint.
4. Supabase redirects back to `/login` with a one-time authorization code.
5. The app exchanges that code with Supabase Auth using the saved PKCE verifier and stores the returned Supabase session. It removes the callback code from the address bar and clears the verifier after exchange.
6. Customer profile fields are fetched from `public.users`. Administrator rights continue to be determined by the separate `public.admin_access` allowlist; selecting an OAuth provider does not grant admin access.

## Required Supabase configuration

Built-in OAuth provider switches are part of Supabase Auth configuration, not regular rows in `public` tables. The `auth.identities` table records providers used by existing identities; it does not provide a complete list of enabled providers. `auth.custom_oauth_providers` applies to custom OAuth/OIDC providers and is not the storage for built-in Google/Apple/Azure switches.

In the Supabase Dashboard for project `ypmiinmkyvzdpakbkers`:

1. Open **Authentication → Sign In / Providers** (label may vary by Dashboard version).
2. Enable only the desired providers and configure each provider's client ID/secret there. Secrets remain in Supabase, not in frontend `.env` files.
3. In **Authentication → URL Configuration**, set the production Site URL and add your exact development and production app callback URLs, including `/login`, to the redirect allow list.
4. In each provider's developer console, set its OAuth callback/redirect URI to `https://ypmiinmkyvzdpakbkers.supabase.co/auth/v1/callback` unless the Supabase Dashboard shows a different callback URI.
5. Deploy the updated frontend and test each enabled provider in a private/incognito browser, including the email-confirmed existing admin account only after verifying the provider's verified-email and identity-linking behavior.

The project management connection available during this code update can inspect database tables and migrations, but it does not expose the built-in provider switch configuration stored in Supabase Auth's project configuration. Therefore the exact active provider list was not guessed or represented as independently verified here: the deployed login screen discovers it at runtime from Supabase Auth settings.

## Tests and limitations

`npm test` includes tests that mock the Supabase Auth settings response, ensure only enabled provider flags are rendered by the provider-discovery helper, and verify the authorization URL contains PKCE parameters and the one-time code is exchanged using the verifier. These tests validate frontend behavior, not provider credentials or the live third-party OAuth round trip.

Run locally after installing dependencies:

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Then sign in with each enabled provider and verify it returns to `/login`, creates/links the expected customer profile, and does not grant admin rights unless that identity is already in `public.admin_access`.
