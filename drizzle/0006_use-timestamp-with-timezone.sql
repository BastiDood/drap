DROP VIEW "drap"."active_lab_view";--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "drap"."faculty_choice" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "drap"."lab" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "drap"."lab" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "drap"."lab" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "drap"."student_rank" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "drap"."student_rank" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "drap"."user" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "drap"."user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth"."pending" ALTER COLUMN "expiration" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth"."pending" ALTER COLUMN "expiration" SET DEFAULT now() + INTERVAL '15 minutes';--> statement-breakpoint
ALTER TABLE "auth"."session" ALTER COLUMN "expiration" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ALTER COLUMN "expiration" SET DATA TYPE timestamp with time zone;