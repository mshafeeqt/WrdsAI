DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Required table public.users does not exist. Apply the baseline schema before this migration.';
  END IF;

  ALTER TABLE "users"
    DROP COLUMN IF EXISTS "legacyMongoId";
END $$;