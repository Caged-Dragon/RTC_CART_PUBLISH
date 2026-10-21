-- RT Crackers – order rules + policy cleanup
-- Review, then run in the Supabase SQL editor (or `supabase db push`). NOT applied automatically.
-- Safe to re-run: every statement is CREATE OR REPLACE / IF EXISTS.

-- 1) Enforce the business rules server-side --------------------------------------------------
--    The storefront already shows the minimum-order notice, but anyone calling the RPC directly
--    (or an old cached bundle) could bypass it. These checks make the database the source of truth:
--      • season booking must be open           (merchant_settings.is_season_booking_open)
--      • subtotal >= merchant_settings.minimum_order_value
--      • 10-digit phone, sane quantities (1..500 per line, max 100 lines)
create or replace function private.create_order_v2(
  p_user_id uuid, p_customer_email text, p_customer_phone text, p_shipping jsonb,
  p_items jsonb, p_payment_method text default null, p_customer_note text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_order_id uuid;
  v_order_number bigint;
  v_guest_token uuid;
  v_subtotal numeric(12,2) := 0;
  v_total_boxes integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_line numeric(12,2);
  v_rules public.merchant_settings%rowtype;
  v_phone text := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
begin
  if p_user_id is not null then
    if p_user_id is distinct from (select id from public.users where auth_user_id = auth.uid()) then
      raise exception 'Unauthorized customer';
    end if;
  end if;

  if p_user_id is null and (nullif(trim(coalesce(p_customer_email,'')),'') is null
      or nullif(trim(coalesce(p_customer_phone,'')),'') is null) then
    raise exception 'Guest orders require email and phone';
  end if;

  if length(right(v_phone, 10)) <> 10 then
    raise exception 'Please enter a valid 10-digit phone number';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'Too many different items in one order';
  end if;

  select * into v_rules from public.merchant_settings limit 1;
  if v_rules.id is not null and v_rules.is_season_booking_open is false then
    raise exception 'Season booking is currently closed';
  end if;

  insert into public.orders (
    user_id, customer_email, customer_phone,
    shipping_first_name, shipping_last_name, shipping_phone,
    shipping_address_line_1, shipping_address_line_2, shipping_landmark,
    shipping_city, shipping_district, shipping_state, shipping_postal_code, shipping_country,
    customer_note, payment_method, status, payment_status, placed_at, booking_date,
    guest_tracking_token, final_net_payable
  )
  values (
    p_user_id, nullif(trim(p_customer_email),''), nullif(trim(p_customer_phone),''),
    nullif(trim(p_shipping->>'first_name'),''), nullif(trim(p_shipping->>'last_name'),''),
    nullif(trim(p_shipping->>'phone'),''),
    nullif(trim(p_shipping->>'address_line_1'),''), nullif(trim(p_shipping->>'address_line_2'),''),
    nullif(trim(p_shipping->>'landmark'),''),
    nullif(trim(p_shipping->>'city'),''), nullif(trim(p_shipping->>'district'),''),
    nullif(trim(p_shipping->>'state'),''), nullif(trim(p_shipping->>'postal_code'),''),
    coalesce(nullif(trim(p_shipping->>'country'),''),'India'),
    nullif(trim(coalesce(p_customer_note,'')),''), nullif(trim(p_payment_method),''),
    'pending', 'pending', now(), now(), gen_random_uuid(), 0
  )
  returning id, order_number, guest_tracking_token into v_order_id, v_order_number, v_guest_token;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and is_active = true
    for update;

    if not found then
      raise exception 'Product unavailable';
    end if;

    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 500 then
      raise exception 'Invalid quantity for %', v_product.name;
    end if;
    if v_product.stock_status = 'OUT_OF_STOCK' then
      raise exception 'Product out of stock: %', v_product.name;
    end if;

    v_line := round(v_product.factory_rate * v_qty, 2);
    v_subtotal := v_subtotal + v_line;
    v_total_boxes := v_total_boxes + v_qty;

    insert into public.order_items (
      order_id, product_id, product_code, product_name, category, pack_type,
      unit_price, quantity, line_total, product_image,
      product_name_snapshot, unit_rate_snapshot, quantity_ordered, line_total_snapshot
    )
    values (
      v_order_id, v_product.id, v_product.product_code, v_product.name, v_product.category,
      v_product.pack_type, v_product.factory_rate, v_qty, v_line,
      coalesce(v_product.image_url, v_product.product_image),
      v_product.name, v_product.factory_rate, v_qty, v_line
    );
  end loop;

  -- Raising here rolls back the order header and items inserted above.
  if v_rules.id is not null and coalesce(v_rules.minimum_order_value, 0) > v_subtotal then
    raise exception 'Minimum order is Rs. %', v_rules.minimum_order_value;
  end if;

  update public.orders
  set subtotal = v_subtotal, total_amount = v_subtotal, final_net_payable = v_subtotal,
      total_boxes_count = v_total_boxes, updated_at = now()
  where id = v_order_id;

  insert into public.order_tracking(order_id, status, note)
  values (v_order_id, 'pending', 'Order placed by customer');

  return jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number, 'guest_tracking_token', v_guest_token,
    'subtotal', v_subtotal, 'total_amount', v_subtotal, 'total_boxes_count', v_total_boxes);
end;
$function$;

-- 2) Clear the "multiple permissive policies" performance warning on product_categories ------
--    The ALL policy overlaps the dedicated SELECT policy for the `authenticated` role.
drop policy if exists product_categories_admin_write on public.product_categories;
create policy product_categories_admin_insert on public.product_categories
  for insert to authenticated with check ((select private.is_admin()));
create policy product_categories_admin_update on public.product_categories
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_categories_admin_delete on public.product_categories
  for delete to authenticated using ((select private.is_admin()));

-- 3) OPTIONAL – stop publishing the merchant UPI id to every visitor ---------------------------
--    merchant_settings is readable by the anon role and includes merchant_upi_id. The storefront
--    only needs the columns below. If you do not show UPI to customers, expose a narrow view and
--    point the app at it (change the table name in src/context/StoreContext.tsx), then lock the table:
--
-- create view public.merchant_public_settings with (security_invoker = false) as
--   select minimum_order_value, is_season_booking_open, dispatch_policy_text,
--          whatsapp_booking_number, support_phone, active_catalog_year
--   from public.merchant_settings;
-- grant select on public.merchant_public_settings to anon, authenticated;
-- drop policy if exists public_read_merchant_settings on public.merchant_settings;
-- drop policy if exists authenticated_read_merchant_settings on public.merchant_settings;
-- create policy admins_read_merchant_settings on public.merchant_settings
--   for select to authenticated using ((select private.is_admin()));
