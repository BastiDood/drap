-- We treat the upper bound of the active period (i.e., the draft conclusion date) as the
-- registration close because we technically did only close the registration only during the draft
-- conclusion (thanks to a bug in the user interface).
UPDATE "drap"."draft" SET "registration_closes_at" = upper("active_period") WHERE upper("drap"."draft"."active_period") IS NOT NULL;
