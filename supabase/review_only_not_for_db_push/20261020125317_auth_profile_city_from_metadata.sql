-- Keep Supabase Auth as the only authority for customer identity and passwords.
-- This trigger only synchronizes non-secret customer profile metadata into public.users.
CREATE OR REPLACE FUNCTION private.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_phone text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_first text := nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'full_name', '')), '');
  v_last text := nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), '');
  v_full text := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', concat_ws(' ', v_first, v_last))), '');
  v_city text := nullif(trim(coalesce(new.raw_user_meta_data->>'city', '')), '');
  v_existing_id uuid;
BEGIN
  SELECT id INTO v_existing_id
  FROM public.users
  WHERE lower(email) = lower(new.email)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.users
    SET auth_user_id = new.id,
        first_name = coalesce(v_first, first_name),
        last_name = coalesce(v_last, last_name),
        full_name = coalesce(v_full, full_name),
        phone = coalesce(v_phone, phone),
        phone_number = coalesce(v_phone, phone_number),
        city = coalesce(v_city, city),
        role = 'customer',
        is_customer = true,
        is_active = true,
        last_active_at = now(),
        updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.users(
      auth_user_id, first_name, last_name, full_name, email,
      phone, phone_number, city, role, is_customer, is_active, last_active_at
    )
    VALUES (
      new.id, v_first, v_last, v_full, new.email,
      v_phone, v_phone, v_city, 'customer', true, true, now()
    )
    ON CONFLICT (auth_user_id) DO UPDATE
      SET email = excluded.email,
          city = coalesce(excluded.city, public.users.city),
          updated_at = now();
  END IF;

  RETURN new;
END;
$function$;
