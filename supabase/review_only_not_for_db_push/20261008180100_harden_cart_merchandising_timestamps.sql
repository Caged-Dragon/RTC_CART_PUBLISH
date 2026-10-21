-- Cart merchandising hardening
-- Safe additive change. Does not modify products, orders, auth, checkout RPCs, storage,
-- existing RLS contracts, or other live-site data.

drop trigger if exists homepage_customer_picks_set_updated_at on public.homepage_customer_picks;
create trigger homepage_customer_picks_set_updated_at
before update on public.homepage_customer_picks
for each row execute function public.set_generic_updated_at();
