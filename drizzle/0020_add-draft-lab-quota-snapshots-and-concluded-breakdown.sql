CREATE TABLE "drap"."draft_lab_quota" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"draft_id" bigint NOT NULL,
	"lab_id" text NOT NULL,
	"initial_quota" smallint DEFAULT 0 NOT NULL,
	"lottery_quota" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "draft_lab_quota_draft_id_lab_id_pk" PRIMARY KEY("draft_id","lab_id"),
	CONSTRAINT "draft_lab_quota_initial_quota_non_negative_check" CHECK ("drap"."draft_lab_quota"."initial_quota" >= 0),
	CONSTRAINT "draft_lab_quota_lottery_quota_non_negative_check" CHECK ("drap"."draft_lab_quota"."lottery_quota" >= 0)
);
--> statement-breakpoint
ALTER TABLE "drap"."draft_lab_quota" ADD CONSTRAINT "draft_lab_quota_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."draft_lab_quota" ADD CONSTRAINT "draft_lab_quota_lab_id_lab_lab_id_fk" FOREIGN KEY ("lab_id") REFERENCES "drap"."lab"("lab_id") ON DELETE no action ON UPDATE cascade;