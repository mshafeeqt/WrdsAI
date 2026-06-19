DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Required table public.users does not exist. Apply the baseline schema before this migration.';
  END IF;

  ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "className" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "userRole" VARCHAR(255) DEFAULT 'Student';
END $$;
