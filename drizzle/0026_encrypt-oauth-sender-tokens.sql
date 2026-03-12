ALTER TABLE "email"."candidate_sender" RENAME COLUMN "expiration" TO "expired_at";--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ADD COLUMN "access_token_iv" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ADD COLUMN "access_token_cipher" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ADD COLUMN "refresh_token_iv" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" ADD COLUMN "refresh_token_cipher" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" DROP COLUMN "access_token";--> statement-breakpoint
ALTER TABLE "email"."candidate_sender" DROP COLUMN "refresh_token";