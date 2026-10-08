# RT Crackers transactional email

This function sends customer-facing transactional emails through Resend while resolving the sender from `business_email_addresses` + `business_email_purposes` and recording outbound messages in `email_messages` / `email_recipients`.

It supports:
- Supabase Auth Send Email Hook: signup confirmation, password recovery, magic link, email change, reauthentication.
- `order_confirmation` from the storefront.
- `order_status` for future/admin lifecycle notifications.
- `quotation` from the storefront email-quotation flow.

Required Supabase Edge Function secrets:
- `RESEND_API_KEY`
- `SEND_EMAIL_HOOK_SECRET` (only for the Auth Send Email Hook)

The Supabase project automatically provides the server-side secret key to Edge Functions; never put that key in the browser.
