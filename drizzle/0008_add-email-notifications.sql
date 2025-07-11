CREATE TABLE "email"."notification" (
	"id" "ulid" PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"metadata" jsonb NOT NULL
);
