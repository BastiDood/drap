CREATE TABLE "drap"."student_rank_lab" (
	"draft_id" bigint NOT NULL,
	"user_id" "ulid" NOT NULL,
	"lab_id" text NOT NULL,
	"index" bigint NOT NULL,
	"remark" varchar(1028) DEFAULT '' NOT NULL,
	CONSTRAINT "student_rank_lab_draft_id_user_id_lab_id_pk" PRIMARY KEY("draft_id","user_id","lab_id")
);
--> statement-breakpoint
ALTER TABLE "auth"."session" ALTER COLUMN "id" SET DEFAULT gen_ulid();--> statement-breakpoint
ALTER TABLE "drap"."student_rank_lab" ADD CONSTRAINT "student_rank_lab_draft_id_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "drap"."draft"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."student_rank_lab" ADD CONSTRAINT "student_rank_lab_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "drap"."user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."student_rank_lab" ADD CONSTRAINT "student_rank_lab_lab_id_lab_lab_id_fk" FOREIGN KEY ("lab_id") REFERENCES "drap"."lab"("lab_id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "drap"."student_rank" DROP COLUMN "labs";