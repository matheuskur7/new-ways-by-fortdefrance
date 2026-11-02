ALTER TABLE "card_fee_providers" DROP CONSTRAINT "card_fee_providers_name_unique";--> statement-breakpoint
ALTER TABLE "card_fees" DROP CONSTRAINT "card_fees_installments_check";--> statement-breakpoint
ALTER TABLE "card_fee_groups" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "card_fee_providers" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "card_fees" ADD COLUMN "organization_id" text;--> statement-breakpoint
-- O catálogo global existente vira uma cópia independente por empresa.
-- A primeira empresa preserva os UUIDs; as demais recebem UUIDs gerados pelo PostgreSQL.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM card_fee_providers) AND NOT EXISTS (SELECT 1 FROM organization) THEN
    RAISE EXCEPTION 'Cadastre uma empresa antes de migrar o catálogo global de taxas.';
  END IF;
END $$;
UPDATE card_fee_providers SET organization_id = (SELECT id FROM organization ORDER BY created_at, id LIMIT 1);
UPDATE card_fee_groups g SET organization_id = p.organization_id FROM card_fee_providers p WHERE g.provider_id = p.id;
UPDATE card_fees r SET organization_id = g.organization_id FROM card_fee_groups g WHERE r.group_id = g.id;
CREATE TEMP TABLE fee_provider_copies ON COMMIT DROP AS
  SELECT p.id AS source_id, o.id AS organization_id, uuidv7() AS id
  FROM card_fee_providers p CROSS JOIN organization o WHERE p.organization_id <> o.id;
CREATE TEMP TABLE fee_group_copies ON COMMIT DROP AS
  SELECT g.id AS source_id, p.organization_id, p.id AS provider_id, uuidv7() AS id
  FROM card_fee_groups g JOIN fee_provider_copies p ON p.source_id = g.provider_id;
INSERT INTO card_fee_providers (id, organization_id, name, created_at, updated_at)
  SELECT c.id, c.organization_id, p.name, p.created_at, p.updated_at FROM fee_provider_copies c JOIN card_fee_providers p ON p.id = c.source_id;
INSERT INTO card_fee_groups (id, organization_id, provider_id, seed_key, name, channel, display_order, logo_svg, created_at, updated_at)
  SELECT c.id, c.organization_id, c.provider_id, g.seed_key, g.name, g.channel, g.display_order, g.logo_svg, g.created_at, g.updated_at
  FROM fee_group_copies c JOIN card_fee_groups g ON g.id = c.source_id;
INSERT INTO card_fees (organization_id, group_id, installments, rate_percent)
  SELECT c.organization_id, c.id, r.installments, r.rate_percent FROM fee_group_copies c JOIN card_fees r ON r.group_id = c.source_id;
ALTER TABLE card_fee_providers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE card_fee_groups ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE card_fees ALTER COLUMN organization_id SET NOT NULL;--> statement-breakpoint
ALTER TABLE "card_fee_groups" ADD CONSTRAINT "card_fee_groups_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "card_fee_providers" ADD CONSTRAINT "card_fee_providers_organization_id_name_unique" UNIQUE("organization_id","name");--> statement-breakpoint
ALTER TABLE "card_fee_providers" ADD CONSTRAINT "card_fee_providers_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "card_fee_groups" ADD CONSTRAINT "card_fee_groups_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_fee_groups" ADD CONSTRAINT "card_fee_groups_organization_id_provider_id_card_fee_providers_organization_id_id_fk" FOREIGN KEY ("organization_id","provider_id") REFERENCES "public"."card_fee_providers"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_fee_providers" ADD CONSTRAINT "card_fee_providers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_fees" ADD CONSTRAINT "card_fees_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_fees" ADD CONSTRAINT "card_fees_organization_id_group_id_card_fee_groups_organization_id_id_fk" FOREIGN KEY ("organization_id","group_id") REFERENCES "public"."card_fee_groups"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_fees" ADD CONSTRAINT "card_fees_installments_check" CHECK ("card_fees"."installments" between 1 and 32767);
