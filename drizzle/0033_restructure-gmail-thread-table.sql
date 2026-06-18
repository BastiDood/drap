CREATE TABLE "email"."gmail_thread" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email"."gmail_thread_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"draft_id" bigint NOT NULL,
	"event_type" "inngest_event_type_enum" NOT NULL,
	"round" smallint,
	"recipient_user_id" "ulid" NOT NULL,
	"gmail_thread_id" text,
	"gmail_message_ids" text[] NOT NULL,
	CONSTRAINT "gmail_thread_logical_key_idx" UNIQUE NULLS NOT DISTINCT("draft_id","event_type","round","recipient_user_id"),
	CONSTRAINT "gmail_thread_recipient_idx" UNIQUE("gmail_thread_id","recipient_user_id")
);
--> statement-breakpoint
DROP TABLE "email"."email_thread" CASCADE;--> statement-breakpoint
ALTER TABLE "email"."gmail_thread" ADD CONSTRAINT "gmail_thread_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email"."gmail_thread" ADD CONSTRAINT "gmail_thread_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "drap"."user"("id") ON DELETE cascade ON UPDATE cascade;