ALTER TABLE "email"."notification" ADD COLUMN "draft_id" bigint NOT NULL DEFAULT 2;--> statement-breakpoint
ALTER TABLE "email"."notification" ADD CONSTRAINT "notification_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "email"."notification" ALTER COLUMN "draft_id" DROP DEFAULT;