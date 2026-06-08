CREATE TABLE "email"."email_thread" (
	"email_thread_id" "ulid" NOT NULL,
	"message_ids" text NOT NULL,
	"email_subject" text NOT NULL,
	"recipient_email" text NOT NULL,
	"sender_email" text NOT NULL,
	"draft_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "email_thread_draft_id_email_subject_recipient_email_pk" PRIMARY KEY("draft_id","email_subject","recipient_email")
);
--> statement-breakpoint
ALTER TABLE "email"."email_thread" ADD CONSTRAINT "email_thread_recipient_email_user_email_fk" FOREIGN KEY ("recipient_email") REFERENCES "drap"."user"("email") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email"."email_thread" ADD CONSTRAINT "email_thread_sender_email_user_email_fk" FOREIGN KEY ("sender_email") REFERENCES "drap"."user"("email") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email"."email_thread" ADD CONSTRAINT "email_thread_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "email_thread_id_idx" ON "email"."email_thread" USING btree ("email_thread_id");