-- REVIEW BEFORE APPLYING. This migration intentionally disables direct online order-creation
-- RPC execution for API roles. It is not run automatically by the source package.
-- Official PESO circular warning: https://peso.gov.in/sites/default/files/2023-04/ban%20on%20online%20sale%20of%20fw.pdf
-- Confirm no approved internal workflow depends on these public RPC grants before applying.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (p.proname = 'create_order' OR p.proname LIKE 'create_order_%')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
  END LOOP;
END $$;
