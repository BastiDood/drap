ALTER TABLE "email"."candidate_sender" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email"."designated_sender" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();