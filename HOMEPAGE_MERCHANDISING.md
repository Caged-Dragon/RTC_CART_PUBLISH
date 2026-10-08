# Homepage customer-focused products

The homepage Best Sellers section is controlled by `public.homepage_customer_picks`.

It is intentionally a separate table so merchandising can be changed without changing `public.products` or the checkout/order model.

Important fields:
- `display_order`: homepage position
- `is_active`: show/hide the pick
- `badge_text`: short badge such as Customer Pick, Family Pick, Premium Pick
- `customer_label`: headline shown above the product card
- `customer_reason`: supporting customer-focused copy
- `customer_score`: merchandising score used for the admin team's ranking
- `rating_stars` / `rating_count`: reserved for real product-level ratings; the current public `reviews` table has no rows, so the storefront does not fabricate ratings
- `admin_note`: internal merchandising note

Only rows with `website_key = 'cart'` are visible to this storefront. Public users can read active rows; only authenticated admins can modify them through RLS.
