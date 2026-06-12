CREATE TYPE "public"."inngest_event_type_enum" AS ENUM('draft/round.started.email.batch', 'draft/round.started.email.fallback', 'draft/round.submitted.email.batch', 'draft/round.submitted.email.fallback', 'draft/lottery.intervened.email.batch', 'draft/lottery.intervened.email.fallback', 'draft/draft.concluded.email.batch', 'draft/draft.concluded.email.fallback', 'draft/draft.finalization.email.batch', 'draft/draft.finalization.email.fallback', 'draft/user.assigned.email.batch', 'draft/user.assigned.email.fallback');--> statement-breakpoint
CREATE TABLE "email"."email_thread" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email"."email_thread_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"draft_id" bigint NOT NULL,
	"event_type" "inngest_event_type_enum" NOT NULL,
	"round" smallint,
	"recipient_user_id" "ulid" NOT NULL,
	"gmail_thread_id" text NOT NULL,
	"gmail_message_ids" text[] NOT NULL,
	"gmail_message_ids_text" text GENERATED ALWAYS AS (array_to_string("email"."email_thread"."gmail_message_ids", ' ')) STORED NOT NULL,
	CONSTRAINT "unique_round" UNIQUE NULLS NOT DISTINCT("round")
);
--> statement-breakpoint
ALTER TABLE "email"."email_thread" ADD CONSTRAINT "email_thread_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email"."email_thread" ADD CONSTRAINT "email_thread_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "drap"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "thread_draft_event_round_lab_recipient_idx" ON "email"."email_thread" USING btree ("draft_id","event_type","round","recipient_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "thread_recipient_idx" ON "email"."email_thread" USING btree ("gmail_thread_id","recipient_user_id");