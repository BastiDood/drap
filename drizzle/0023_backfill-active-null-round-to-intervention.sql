-- Reinterpret legacy active `curr_round = NULL` rows as intervention (`max_rounds + 1`).
-- Concluded drafts (non-null upper(active_period)) intentionally remain NULL.
UPDATE "drap"."draft"
SET "curr_round" = "max_rounds" + 1
WHERE "curr_round" IS NULL AND upper("active_period") IS NULL;

-- Assert that the migration upholds our new invariants.
DO $$
DECLARE
  active_null_round_count integer;
  invalid_round_count integer;
BEGIN
  SELECT count(*)
  INTO active_null_round_count
  FROM "drap"."draft"
  WHERE "curr_round" IS NULL AND upper("active_period") IS NULL;

  IF active_null_round_count > 0 THEN
    RAISE EXCEPTION
      'migration invariant violated: % active draft(s) still have curr_round=NULL',
      active_null_round_count;
  END IF;

  SELECT count(*)
  INTO invalid_round_count
  FROM "drap"."draft"
  WHERE "curr_round" IS NOT NULL AND ("curr_round" < 0 OR "curr_round" > "max_rounds" + 1);

  IF invalid_round_count > 0 THEN
    RAISE EXCEPTION
      'migration invariant violated: % draft(s) have curr_round outside [0, max_rounds + 1]',
      invalid_round_count;
  END IF;
END $$;
