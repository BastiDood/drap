DROP VIEW "drap"."active_lab_view";--> statement-breakpoint
ALTER TABLE "drap"."lab" DROP CONSTRAINT "lab_quota_non_negative_check";--> statement-breakpoint
ALTER TABLE "drap"."lab" DROP COLUMN "quota";--> statement-breakpoint
CREATE VIEW "drap"."active_lab_view" AS (select "created_at", "lab_id", "lab_name", "deleted_at" from "drap"."lab" where "drap"."lab"."deleted_at" is null);