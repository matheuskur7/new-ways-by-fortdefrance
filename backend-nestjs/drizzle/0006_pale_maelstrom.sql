CREATE TABLE "card_fee_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"seed_key" text,
	"name" text NOT NULL,
	"channel" text NOT NULL,
	"display_order" integer DEFAULT 100 NOT NULL,
	"logo_svg" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_fee_groups_seed_key_unique" UNIQUE("seed_key")
);
--> statement-breakpoint
CREATE TABLE "card_fees" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"group_id" uuid NOT NULL,
	"installments" smallint NOT NULL,
	"rate_percent" numeric(5, 2) NOT NULL,
	CONSTRAINT "card_fees_group_id_installments_unique" UNIQUE("group_id","installments"),
	CONSTRAINT "card_fees_installments_check" CHECK ("card_fees"."installments" between 1 and 12),
	CONSTRAINT "card_fees_rate_check" CHECK ("card_fees"."rate_percent" >= 0 and "card_fees"."rate_percent" < 100)
);
--> statement-breakpoint
ALTER TABLE "card_fees" ADD CONSTRAINT "card_fees_group_id_card_fee_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."card_fee_groups"("id") ON DELETE cascade ON UPDATE no action;