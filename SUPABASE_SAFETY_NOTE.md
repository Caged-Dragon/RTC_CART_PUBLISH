# Supabase Safety Note

This source package is designed to coexist with the existing production Supabase project.

## Not modified
- Supabase URL/client credentials
- `src/lib/supabase.ts`
- Product/cart/auth/store/category context contracts
- SQL migrations
- `supabase/frontend_database_integration.sql`
- `supabase/final-performance-and-categories.sql`
- `supabase/theme_page_settings.sql`
- RLS policies
- Storage
- Edge functions
- Order RPC / checkout contract

## Theme integration
The frontend theme reader uses the existing `theme_page_settings` table with `website_key = 'cart'` and performs read-only requests. It never writes theme records from the storefront.
