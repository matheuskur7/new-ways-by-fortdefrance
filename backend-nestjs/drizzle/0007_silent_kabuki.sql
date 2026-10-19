CREATE TABLE "card_fee_providers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_fee_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "card_fee_groups" DROP CONSTRAINT "card_fee_groups_seed_key_unique";--> statement-breakpoint
ALTER TABLE "card_fee_groups" ADD COLUMN "provider_id" uuid;--> statement-breakpoint
-- Os grupos anteriores à entidade de provedor pertencem à tabela inicial InfinitePay.
INSERT INTO "card_fee_providers" ("name")
SELECT 'InfinitePay' WHERE EXISTS (SELECT 1 FROM "card_fee_groups")
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
UPDATE "card_fee_groups"
SET "provider_id" = (SELECT "id" FROM "card_fee_providers" WHERE "name" = 'InfinitePay');--> statement-breakpoint
ALTER TABLE "card_fee_groups" ALTER COLUMN "provider_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "card_fee_groups" ADD CONSTRAINT "card_fee_groups_provider_id_card_fee_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."card_fee_providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_fee_groups" ADD CONSTRAINT "card_fee_groups_provider_id_seed_key_unique" UNIQUE("provider_id","seed_key");
