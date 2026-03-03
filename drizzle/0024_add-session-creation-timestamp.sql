ALTER TABLE "auth"."session" RENAME COLUMN "expiration" TO "expired_at";--> statement-breakpoint
ALTER TABLE "auth"."session" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;