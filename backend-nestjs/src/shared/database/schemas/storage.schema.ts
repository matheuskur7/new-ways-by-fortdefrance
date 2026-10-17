import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { organization } from './organization.schema.js';

export const imageStatus = pgEnum('image_status', ['pending', 'ready']);

export const images = pgTable('images', {
  id: uuid('id').primaryKey(),
  // Nullable para preservar registros anteriores; novas imagens sempre recebem a organização.
  organizationId: text('organization_id').references(() => organization.id, {
    onDelete: 'restrict',
  }),
  key: text('key').notNull().unique(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  checksum: text('checksum').notNull(),
  status: imageStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export type Image = typeof images.$inferSelect;
