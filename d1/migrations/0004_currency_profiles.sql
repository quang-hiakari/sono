-- Migration 0004: Add currency to debt_books, create profiles table

ALTER TABLE debt_books ADD COLUMN currency TEXT NOT NULL DEFAULT 'VND';

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  full_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  bank_qr_url TEXT,
  updated_at INTEGER DEFAULT (unixepoch('now') * 1000)
);
