import { relations, sql } from 'drizzle-orm';
import {
  check,
  integer,
  smallint,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const cardFeeProviders = pgTable('card_fee_providers', {
  id: uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  name: text().notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const cardFeeGroups = pgTable(
  'card_fee_groups',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => cardFeeProviders.id, { onDelete: 'restrict' }),
    seedKey: text('seed_key'),
    name: text().notNull(),
    channel: text().notNull(),
    displayOrder: integer('display_order').notNull().default(100),
    logoSvg: text('logo_svg'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.providerId, table.seedKey)],
);

export const cardFees = pgTable(
  'card_fees',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    groupId: uuid('group_id')
      .notNull()
      .references(() => cardFeeGroups.id, { onDelete: 'cascade' }),
    installments: smallint().notNull(),
    ratePercent: numeric('rate_percent', { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [
    unique().on(table.groupId, table.installments),
    check('card_fees_installments_check', sql`${table.installments} between 1 and 12`),
    check('card_fees_rate_check', sql`${table.ratePercent} >= 0 and ${table.ratePercent} < 100`),
  ],
);

export const cardFeeProvidersRelations = relations(cardFeeProviders, ({ many }) => ({
  groups: many(cardFeeGroups),
}));
export const cardFeeGroupsRelations = relations(cardFeeGroups, ({ one, many }) => ({
  provider: one(cardFeeProviders, {
    fields: [cardFeeGroups.providerId],
    references: [cardFeeProviders.id],
  }),
  rates: many(cardFees),
}));
export const cardFeesRelations = relations(cardFees, ({ one }) => ({
  group: one(cardFeeGroups, { fields: [cardFees.groupId], references: [cardFeeGroups.id] }),
}));
