DO $$
DECLARE
  old_constraint_name text;
BEGIN
  IF to_regclass('public.llm_data') IS NULL THEN
    RAISE EXCEPTION 'Required table public.llm_data does not exist. Apply the baseline schema before this migration.';
  END IF;

  IF to_regclass('public.user_question_events') IS NULL THEN
    RAISE EXCEPTION 'Required table public.user_question_events does not exist. Apply the baseline schema before this migration.';
  END IF;

  ALTER TABLE "llm_data"
    ADD COLUMN IF NOT EXISTS "user_role" TEXT NOT NULL DEFAULT 'Student',
    ADD COLUMN IF NOT EXISTS "platform_context" TEXT NOT NULL DEFAULT 'student',
    ADD COLUMN IF NOT EXISTS "activity_type" TEXT NOT NULL DEFAULT 'chat';

  SELECT con.conname INTO old_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = con.connamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'llm_data'
    AND con.contype = 'u'
    AND (
      SELECT array_agg(att.attname::text ORDER BY att.attname::text)
      FROM unnest(con.conkey) AS col(attnum)
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = col.attnum
    ) = ARRAY['subject', 'user_class', 'user_email']::text[];

  IF old_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "llm_data" DROP CONSTRAINT %I', old_constraint_name);
  END IF;

  DROP INDEX IF EXISTS "llm_data_user_email_user_class_subject";
  DROP INDEX IF EXISTS "llm_data_user_email_user_class_subject_unique";

  CREATE UNIQUE INDEX IF NOT EXISTS "llm_data_scope_unique"
    ON "llm_data" (
      "user_email",
      "user_role",
      "platform_context",
      "activity_type",
      "user_class",
      "subject"
    );

  CREATE INDEX IF NOT EXISTS "llm_data_user_email_idx" ON "llm_data" ("user_email");
  CREATE INDEX IF NOT EXISTS "llm_data_user_role_idx" ON "llm_data" ("user_role");
  CREATE INDEX IF NOT EXISTS "llm_data_platform_context_idx" ON "llm_data" ("platform_context");
  CREATE INDEX IF NOT EXISTS "llm_data_activity_type_idx" ON "llm_data" ("activity_type");
  CREATE INDEX IF NOT EXISTS "llm_data_subject_idx" ON "llm_data" ("subject");
  CREATE INDEX IF NOT EXISTS "llm_data_last_used_at_idx" ON "llm_data" ("last_used_at");

  ALTER TABLE "user_question_events"
    ADD COLUMN IF NOT EXISTS "userRole" VARCHAR(255) DEFAULT 'Student',
    ADD COLUMN IF NOT EXISTS "platformContext" VARCHAR(255) DEFAULT 'student',
    ADD COLUMN IF NOT EXISTS "activityType" VARCHAR(255) DEFAULT 'chat';

  CREATE INDEX IF NOT EXISTS "user_question_events_user_role_idx" ON "user_question_events" ("userRole");
  CREATE INDEX IF NOT EXISTS "user_question_events_platform_context_idx" ON "user_question_events" ("platformContext");
  CREATE INDEX IF NOT EXISTS "user_question_events_activity_type_idx" ON "user_question_events" ("activityType");
END $$;
