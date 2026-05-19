import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Better Auth tables — date fields use integer(timestamp_ms) so Drizzle
// auto-converts JS Date objects to/from integers (D1 does not accept Date objects)

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default(''),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp_ms' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }),
});

// App: user profile with banking details (separate from Better Auth's user table)
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  country: text('country').notNull().default('VN'),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountHolder: text('account_holder'),
  branchName: text('branch_name'),
  bankQrUrl: text('bank_qr_url'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
});

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull(),
  creditorId: text('creditor_id').notNull(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  debtDate: text('debt_date').notNull(),
  invoiceUrl: text('invoice_url'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  deleteReason: text('delete_reason'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
});

export const debtBooks = sqliteTable('debt_books', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  creditorId: text('creditor_id').notNull(),
  debtorId: text('debtor_id').notNull(),
  currency: text('currency').notNull().default('VND'),
  debtorDisplayName: text('debtor_display_name'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  deleteReason: text('delete_reason'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
});

export const banks = sqliteTable('banks', {
  id: text('id').primaryKey(),
  country: text('country').notNull(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  bin: text('bin'),
  swift: text('swift'),
});
