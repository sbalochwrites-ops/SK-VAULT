import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const vaultFiles = pgTable('vault_files', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  size: text('size').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  date: text('date').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  category: text('category').notNull(),
  retention: text('retention').notNull(),
  retentionColor: text('retention_color').notNull(),
  thumb: text('thumb'),
  icon: text('icon').notNull(),
  checksum: text('checksum'),
  mimeType: text('mime_type'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const vaultAuditLogs = pgTable('vault_audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  files: many(vaultFiles),
  auditLogs: many(vaultAuditLogs),
}));

export const vaultFilesRelations = relations(vaultFiles, ({ one }) => ({
  owner: one(users, {
    fields: [vaultFiles.userId],
    references: [users.id],
  }),
}));

export const vaultAuditLogsRelations = relations(vaultAuditLogs, ({ one }) => ({
  user: one(users, {
    fields: [vaultAuditLogs.userId],
    references: [users.id],
  }),
}));
