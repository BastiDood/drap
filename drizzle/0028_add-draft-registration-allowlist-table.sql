CREATE TABLE "drap"."draft_registration_allowlist" (
	"draft_id" bigint NOT NULL,
	"student_user_id" "ulid" NOT NULL,
	"admin_user_id" "ulid" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draft_registration_allowlist_draft_id_student_user_id_pk" PRIMARY KEY("draft_id","student_user_id")
);
--> statement-breakpoint
ALTER TABLE "drap"."draft_registration_allowlist" ADD CONSTRAINT "draft_registration_allowlist_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."draft_registration_allowlist" ADD CONSTRAINT "draft_registration_allowlist_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "drap"."user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."draft_registration_allowlist" ADD CONSTRAINT "draft_registration_allowlist_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "drap"."user"("id") ON DELETE no action ON UPDATE cascade;