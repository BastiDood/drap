DROP TABLE "auth"."pending" CASCADE;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ADD COLUMN "scopes" text[] DEFAULT '{}' NOT NULL;