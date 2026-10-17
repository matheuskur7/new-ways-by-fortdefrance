import { sql } from 'drizzle-orm';
import { check, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organization } from './organization.schema.js';

export const imageStatus = pgEnum('image_status', ['pending', 'ready']);

export const images = pgTable(
  'images',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, {
        onDelete: 'restrict',
      }),

    keyPrefix: text('key_prefix').notNull(),

    key: text('key')
      .notNull()
      .unique()
      .generatedAlwaysAs(
        sql`'images/' || "organization_id" || '/' || "key_prefix" || '/' || "id"::text`,
      ),

    contentType: text('content_type'),

    size: integer('size'),

    status: imageStatus('status').notNull().default('pending'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },

  (table) => [
    check(
      'images_ready_metadata',
      sql`${table.status} <> 'ready' OR (${table.contentType} IS NOT NULL AND ${table.size} IS NOT NULL)`,
    ),
    check('images_size_positive', sql`${table.size} > 0`),
  ],
);
export type Image = typeof images.$inferSelect;
