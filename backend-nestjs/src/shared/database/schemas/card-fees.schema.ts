import { sql } from 'drizzle-orm';
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

export const cardFeeGroups = pgTable('card_fee_groups', {
  id: uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  seedKey: text('seed_key').unique(),
  name: text().notNull(),
  channel: text().notNull(),
  displayOrder: integer('display_order').notNull().default(100),
  logoSvg: text('logo_svg'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
