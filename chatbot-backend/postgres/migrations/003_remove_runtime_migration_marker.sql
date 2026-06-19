DO $$
BEGIN
  RAISE NOTICE 'Runtime schema alterations have been replaced by explicit SQL migrations.';
END $$;
