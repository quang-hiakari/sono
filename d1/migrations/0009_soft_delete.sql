-- Migration 0009: Soft delete for debts and debt_books

ALTER TABLE debts ADD COLUMN deleted_at INTEGER;   -- epoch ms, NULL = active
ALTER TABLE debts ADD COLUMN delete_reason TEXT;

ALTER TABLE debt_books ADD COLUMN deleted_at INTEGER;
ALTER TABLE debt_books ADD COLUMN delete_reason TEXT;
