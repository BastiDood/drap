CREATE SCHEMA "drap";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "email";
--> statement-breakpoint
CREATE TABLE "drap"."draft" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "drap"."draft_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"curr_round" smallint DEFAULT 0,
	"max_rounds" smallint NOT NULL,
	"active_period" "tstzrange" DEFAULT tstzrange(now(), null, '[)') NOT NULL,
	CONSTRAINT "draft_curr_round_within_bounds" CHECK ("drap"."draft"."curr_round" BETWEEN 0 AND "drap"."draft"."max_rounds")
);
--> statement-breakpoint
CREATE TABLE "drap"."faculty_choice" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"draft_id" bigint NOT NULL,
	"round" smallint,
	"lab_id" text NOT NULL,
	"user_id" "ulid",
	CONSTRAINT "faculty_choice_only_once_per_draft_round" UNIQUE NULLS NOT DISTINCT("draft_id","round","lab_id"),
	CONSTRAINT "faculty_choice_post_registration_round_check" CHECK ("drap"."faculty_choice"."round" > 0)
);
--> statement-breakpoint
CREATE TABLE "drap"."faculty_choice_user" (
	"faculty_user_id" "ulid" NOT NULL,
	"student_user_id" "ulid" NOT NULL,
	"draft_id" bigint NOT NULL,
	"round" smallint,
	"lab_id" text NOT NULL,
	CONSTRAINT "faculty_choice_user_unique_student_selection_per_draft" UNIQUE("draft_id","student_user_id"),
	CONSTRAINT "faculty_choice_user_different_student_and_faculty_users" CHECK ("drap"."faculty_choice_user"."student_user_id" <> "drap"."faculty_choice_user"."faculty_user_id")
);
--> statement-breakpoint
CREATE TABLE "drap"."lab" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"lab_id" text PRIMARY KEY NOT NULL,
	"lab_name" text NOT NULL,
	"quota" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "lab_lab_name_unique" UNIQUE("lab_name"),
	CONSTRAINT "lab_quota_non_negative_check" CHECK ("drap"."lab"."quota" >= 0)
);
--> statement-breakpoint
CREATE TABLE "drap"."student_rank" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"draft_id" bigint NOT NULL,
	"user_id" "ulid" NOT NULL,
	"labs" text[] NOT NULL,
	CONSTRAINT "student_rank_draft_id_user_id_pk" PRIMARY KEY("draft_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "drap"."user" (
	"id" "ulid" PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"student_number" bigint,
	"is_admin" boolean DEFAULT false NOT NULL,
	"google_user_id" text,
	"lab_id" text,
	"email" text NOT NULL,
	"given_name" text DEFAULT '' NOT NULL,
	"family_name" text DEFAULT '' NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	CONSTRAINT "user_student_number_unique" UNIQUE("student_number"),
	CONSTRAINT "user_google_user_id_unique" UNIQUE("google_user_id"),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_student_number_within_bounds" CHECK ("drap"."user"."student_number" BETWEEN 100000000 AND 1000000000),
	CONSTRAINT "user_email_non_empty" CHECK ("drap"."user"."email" <> '')
);
--> statement-breakpoint
CREATE TABLE "auth"."pending" (
	"id" "ulid" PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
	"expiration" timestamp DEFAULT now() + INTERVAL '15 minutes' NOT NULL,
	"nonce" "bytea" DEFAULT gen_random_bytes(64) NOT NULL,
	"has_extended_scope" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."session" (
	"id" "ulid" PRIMARY KEY NOT NULL,
	"expiration" timestamp NOT NULL,
	"user_id" "ulid" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email"."candidate_sender" (
	"user_id" "ulid" PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expiration" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email"."designated_sender" (
	"candidate_sender_user_id" "ulid" PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice" ADD CONSTRAINT "faculty_choice_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice" ADD CONSTRAINT "faculty_choice_lab_id_lab_lab_id_fk" FOREIGN KEY ("lab_id") REFERENCES "drap"."lab"("lab_id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice" ADD CONSTRAINT "faculty_choice_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "drap"."user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice_user" ADD CONSTRAINT "faculty_choice_user_faculty_user_id_user_id_fk" FOREIGN KEY ("faculty_user_id") REFERENCES "drap"."user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice_user" ADD CONSTRAINT "faculty_choice_user_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "drap"."user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice_user" ADD CONSTRAINT "faculty_choice_user_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice_user" ADD CONSTRAINT "faculty_choice_user_lab_id_lab_lab_id_fk" FOREIGN KEY ("lab_id") REFERENCES "drap"."lab"("lab_id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice_user" ADD CONSTRAINT "faculty_choice_user_draft_id_round_lab_id_faculty_choice_draft_id_round_lab_id_fk" FOREIGN KEY ("draft_id","round","lab_id") REFERENCES "drap"."faculty_choice"("draft_id","round","lab_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drap"."student_rank" ADD CONSTRAINT "student_rank_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."student_rank" ADD CONSTRAINT "student_rank_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "drap"."user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."user" ADD CONSTRAINT "user_lab_id_lab_lab_id_fk" FOREIGN KEY ("lab_id") REFERENCES "drap"."lab"("lab_id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "drap"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ADD CONSTRAINT "candidate_sender_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "drap"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email"."designated_sender" ADD CONSTRAINT "designated_sender_candidate_sender_user_id_candidate_sender_user_id_fk" FOREIGN KEY ("candidate_sender_user_id") REFERENCES "email"."candidate_sender"("user_id") ON DELETE cascade ON UPDATE cascade;