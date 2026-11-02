import { organization } from './organization.schema.js';
import { relations, sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/** Taxa de uma quantidade de parcelas; o percentual usa string decimal exata ("3.94"). */
export type TaxRate = { installments: number; ratePercent: string };

export const taxProviders = pgTable(
  'tax_providers',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    logo: text(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(table.organizationId, table.name),
    unique().on(table.organizationId, table.id),
  ],
);

export const taxBrands = pgTable(
  'tax_brands',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => taxProviders.id, { onDelete: 'restrict' }),
    name: text().notNull(),
    channel: text().notNull(),
    displayOrder: smallint('display_order').notNull().default(100),
    logo: text(),
    rates: jsonb().$type<TaxRate[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(table.organizationId, table.id),
    foreignKey({
      columns: [table.organizationId, table.providerId],
      foreignColumns: [taxProviders.organizationId, taxProviders.id],
    }),
    check(
      'tax_brands_rates_check',
      sql`jsonb_typeof(${table.rates}) = 'array' and jsonb_array_length(${table.rates}) between 1 and 32767`,
    ),
  ],
);

export const taxProvidersRelations = relations(taxProviders, ({ many }) => ({
  brands: many(taxBrands),
}));
export const taxBrandsRelations = relations(taxBrands, ({ one }) => ({
  provider: one(taxProviders, {
    fields: [taxBrands.providerId],
    references: [taxProviders.id],
  }),
}));
