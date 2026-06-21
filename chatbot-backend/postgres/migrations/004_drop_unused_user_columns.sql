DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Required table public.users does not exist. Apply the baseline schema before this migration.';
  END IF;

  ALTER TABLE "users"
    DROP COLUMN IF EXISTS "ageGroup",
    DROP COLUMN IF EXISTS "childPlan",
    DROP COLUMN IF EXISTS "subscriptionType";
END $$;
