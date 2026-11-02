CREATE TABLE "tax_brands" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" text NOT NULL,
	"provider_id" uuid NOT NULL,
	"seed_key" text,
	"name" text NOT NULL,
	"channel" text NOT NULL,
	"display_order" integer DEFAULT 100 NOT NULL,
	"logo" text,
	"rates" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_brands_provider_id_seed_key_unique" UNIQUE("provider_id","seed_key"),
	CONSTRAINT "tax_brands_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "tax_brands_rates_check" CHECK (jsonb_typeof("tax_brands"."rates") = 'array' and jsonb_array_length("tax_brands"."rates") between 1 and 32767)
);
--> statement-breakpoint
CREATE TABLE "tax_providers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_providers_organization_id_name_unique" UNIQUE("organization_id","name"),
	CONSTRAINT "tax_providers_organization_id_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
ALTER TABLE "tax_brands" ADD CONSTRAINT "tax_brands_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_brands" ADD CONSTRAINT "tax_brands_provider_id_tax_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."tax_providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_brands" ADD CONSTRAINT "tax_brands_organization_id_provider_id_tax_providers_organization_id_id_fk" FOREIGN KEY ("organization_id","provider_id") REFERENCES "public"."tax_providers"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_providers" ADD CONSTRAINT "tax_providers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Copia provedores e grupos preservando UUIDs; as taxas de cada grupo viram o JSON "rates" da bandeira.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM card_fee_groups g WHERE NOT EXISTS (SELECT 1 FROM card_fees f WHERE f.group_id = g.id)) THEN
    RAISE EXCEPTION 'Há grupos de taxas sem nenhuma taxa; cadastre ao menos uma taxa ou remova o grupo antes de migrar.';
  END IF;
END $$;
INSERT INTO tax_providers (id, organization_id, name, created_at, updated_at)
  SELECT id, organization_id, name, created_at, updated_at FROM card_fee_providers;
INSERT INTO tax_brands (id, organization_id, provider_id, seed_key, name, channel, display_order, logo, rates, created_at, updated_at)
  SELECT g.id, g.organization_id, g.provider_id, g.seed_key, g.name, g.channel, g.display_order, g.logo_svg,
    (SELECT jsonb_agg(jsonb_build_object('installments', f.installments, 'ratePercent', f.rate_percent::text) ORDER BY f.installments)
      FROM card_fees f WHERE f.group_id = g.id),
    g.created_at, g.updated_at
  FROM card_fee_groups g;
