import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth.schema.js';
import { imageStatus } from './image-status.js';

// Fotos pessoais têm proprietário próprio e não dependem de uma organização.
export const userImages = pgTable(
  'user_images',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    // Preserva o objeto original durante a migração, sem copiar arquivos no S3.
    importedKey: text('imported_key'),
    key: text('key')
      .notNull()
      .generatedAlwaysAs(
        sql`COALESCE("imported_key", 'user-image/' || "user_id" || '/' || "id"::text)`,
      ),
    contentType: text('content_type'),
    size: integer('size'),
    status: imageStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'user_images_ready_metadata',
      sql`${table.status} <> 'ready' OR (${table.contentType} IS NOT NULL AND ${table.size} IS NOT NULL)`,
    ),
    check('user_images_size_positive', sql`${table.size} > 0`),
  ],
);
export type UserImage = typeof userImages.$inferSelect;
