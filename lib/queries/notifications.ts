import { getDB } from '@/lib/db';

export interface PendingApproval {
  book_id: string;
  book_name: string;
  debtor_name: string;
  debtor_email: string;
  payment_count: number;
  currency: string;
}

export interface RecentDebtEntry {
  debt_id: string;
  book_id: string;
  book_name: string;
  currency: string;
  title: string;
  amount: number;
  debt_date: string;
  created_at: string;
}

export async function getPendingApprovals(creditorId: string): Promise<PendingApproval[]> {
  const db = getDB();
  const { results } = await db.prepare(`
    SELECT
      b.id        AS book_id,
      b.name      AS book_name,
      b.currency,
      COALESCE(pr.full_name, NULLIF(u.name, '')) AS debtor_name,
      u.email     AS debtor_email,
      COUNT(p.id) AS payment_count
    FROM payments p
    JOIN debt_books b ON b.id = p.book_id
    JOIN "user" u ON u.id = p.debtor_id
    LEFT JOIN profiles pr ON pr.id = p.debtor_id
    WHERE b.creditor_id = ? AND p.status = 'pending'
    GROUP BY b.id, b.name, b.currency, u.name, u.email, pr.full_name
    ORDER BY payment_count DESC
  `).bind(creditorId).all<PendingApproval>();
  return results;
}

export async function getRecentDebts(userId: string): Promise<RecentDebtEntry[]> {
  const db = getDB();
  const { results } = await db.prepare(`
    SELECT
      d.id         AS debt_id,
      d.title,
      d.amount,
      d.debt_date,
      d.created_at,
      b.id         AS book_id,
      b.name       AS book_name,
      b.currency
    FROM debts d
    JOIN debt_books b ON b.id = d.book_id
    WHERE b.creditor_id = ? OR b.debtor_id = ?
    ORDER BY d.created_at DESC
    LIMIT 20
  `).bind(userId, userId).all<RecentDebtEntry>();
  return results;
}
