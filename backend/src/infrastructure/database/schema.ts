import { pgTable, uuid, varchar, text, bigint, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const nodes = pgTable('nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 10 }).notNull().$type<'folder' | 'file'>(),
  parentId: uuid('parent_id').references((): AnyPgColumn => nodes.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  size: bigint('size', { mode: 'number' }),
  extension: varchar('extension', { length: 50 }),
  storageKey: text('storage_key'),
  mimeType: varchar('mime_type', { length: 255 }),
  isTrashed: boolean('is_trashed').notNull().default(false),
  trashedAt: timestamp('trashed_at', { withTimezone: true }),
  originalParentId: uuid('original_parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('nodes_parent_id_idx').on(table.parentId),
  index('nodes_is_trashed_idx').on(table.isTrashed),
  index('nodes_parent_trashed_idx').on(table.parentId, table.isTrashed),
]);

export type NodeSelect = typeof nodes.$inferSelect;
export type NodeInsert = typeof nodes.$inferInsert;
