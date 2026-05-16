import { getDB } from '@/lib/db';

export interface LedgerTotals {
  total: number;
  paid: number;
  remaining: number;
  pendingCount: number;
}

export interface Debt {
  id: string;
  book_id: string;
  title: string;
  amount: number;
  notes: string | null;
  debt_date: string;
  created_at: string;
}

export interface Payment {
  id: string;
  book_id: string;
  debtor_id: string;
  amount: number;
  receipt_url: string | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export async function getLedgerTotals(bookId: string): Promise<LedgerTotals> {
  const db = getDB();
  const [dRow, pRow, cntRow] = await Promise.all([
    db.prepare('SELECT SUM(amount) AS total FROM debts WHERE book_id = ?').bind(bookId).first<{ total: number | null }>(),
    db.prepare('SELECT SUM(amount) AS total FROM payments WHERE book_id = ? AND status = ?').bind(bookId, 'approved').first<{ total: number | null }>(),
    db.prepare('SELECT COUNT(*) AS cnt FROM payments WHERE book_id = ? AND status = ?').bind(bookId, 'pending').first<{ cnt: number }>(),
  ]);
  const total = dRow?.total ?? 0;
  const paid  = pRow?.total ?? 0;
  return { total, paid, remaining: total - paid, pendingCount: cntRow?.cnt ?? 0 };
}

export async function getDebts(bookId: string): Promise<Debt[]> {
  const db = getDB();
  const { results } = await db.prepare(
    'SELECT id, book_id, title, amount, notes, debt_date, created_at FROM debts WHERE book_id = ? ORDER BY created_at DESC'
  ).bind(bookId).all<Debt>();
  return results;
}

export async function getAllPayments(bookId: string): Promise<Payment[]> {
  const db = getDB();
  const { results } = await db.prepare(
    'SELECT id, book_id, debtor_id, amount, receipt_url, note, status, rejection_reason, reviewed_at, created_at FROM payments WHERE book_id = ? ORDER BY created_at DESC'
  ).bind(bookId).all<Payment>();
  return results;
}

export async function getPendingPayments(bookId: string): Promise<Payment[]> {
  const db = getDB();
  const { results } = await db.prepare(
    'SELECT id, book_id, debtor_id, amount, receipt_url, note, status, rejection_reason, reviewed_at, created_at FROM payments WHERE book_id = ? AND status = ? ORDER BY created_at ASC'
  ).bind(bookId, 'pending').all<Payment>();
  return results;
}

export async function getMyPayments(bookId: string, debtorId: string): Promise<Payment[]> {
  const db = getDB();
  const { results } = await db.prepare(
    'SELECT id, book_id, debtor_id, amount, receipt_url, note, status, rejection_reason, reviewed_at, created_at FROM payments WHERE book_id = ? AND debtor_id = ? ORDER BY created_at DESC'
  ).bind(bookId, debtorId).all<Payment>();
  return results;
}
