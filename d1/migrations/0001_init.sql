-- ============================================================
-- SoNo D1 (SQLite) Initial Schema
-- Run: wrangler d1 execute sono-db --file=d1/migrations/0001_init.sql
-- Local: wrangler d1 execute sono-db --local --file=d1/migrations/0001_init.sql
-- ============================================================

-- Better Auth: user table
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Better Auth: session table
CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Better Auth: account table (email/password credentials stored here)
CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TEXT,
  refresh_token_expires_at TEXT,
  scope TEXT,
  password TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Better Auth: verification table
CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- App: named debt book between two users
CREATE TABLE IF NOT EXISTS debt_books (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  creditor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  debtor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(creditor_id, debtor_id),
  CHECK(creditor_id <> debtor_id)
);
CREATE INDEX IF NOT EXISTS idx_debt_books_creditor ON debt_books(creditor_id);
CREATE INDEX IF NOT EXISTS idx_debt_books_debtor ON debt_books(debtor_id);

-- App: debt items recorded by creditor
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES debt_books(id) ON DELETE CASCADE,
  creditor_id TEXT NOT NULL REFERENCES "user"(id),
  title TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  notes TEXT,
  debt_date TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_debts_book ON debts(book_id, created_at DESC);

-- App: payments submitted by debtor, approved by creditor
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES debt_books(id) ON DELETE CASCADE,
  debtor_id TEXT NOT NULL REFERENCES "user"(id),
  amount REAL NOT NULL CHECK(amount > 0),
  receipt_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_book ON payments(book_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_debtor ON payments(debtor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(book_id, status);
