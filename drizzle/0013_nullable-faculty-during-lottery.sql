ALTER TABLE "drap"."faculty_choice_user" ALTER COLUMN "faculty_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "email"."designated_sender" ALTER COLUMN "created_at" SET NOT NULL;