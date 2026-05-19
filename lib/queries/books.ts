import { getDB } from '@/lib/db';

export interface DebtBook {
  id: string;
  name: string;
  creditor_id: string;
  debtor_id: string;
  currency: string;
  creditor_email: string;
  creditor_name: string;
  debtor_email: string;
  debtor_name: string;
  created_at: string;
  deleted_at: number | null;
  delete_reason: string | null;
}

const BOOK_SELECT = `
  SELECT b.id, b.name, b.creditor_id, b.debtor_id, b.currency, b.created_at,
    b.deleted_at, b.delete_reason,
    c.email AS creditor_email, COALESCE(cp.full_name, NULLIF(c.name, '')) AS creditor_name,
    d.email AS debtor_email,
    COALESCE(b.debtor_display_name, dp.full_name, NULLIF(d.name, '')) AS debtor_name
  FROM debt_books b
  JOIN "user" c ON c.id = b.creditor_id
  JOIN "user" d ON d.id = b.debtor_id
  LEFT JOIN profiles cp ON cp.id = b.creditor_id
  LEFT JOIN profiles dp ON dp.id = b.debtor_id
`;

export async function getMyBooks(userId: string): Promise<DebtBook[]> {
  const db = getDB();
  const { results } = await db.prepare(`
    ${BOOK_SELECT}
    WHERE b.creditor_id = ? OR b.debtor_id = ?
    ORDER BY b.created_at DESC
  `).bind(userId, userId).all<DebtBook>();
  return results;
}

export async function getBook(bookId: string): Promise<DebtBook | null> {
  const db = getDB();
  return db.prepare(`${BOOK_SELECT} WHERE b.id = ?`).bind(bookId).first<DebtBook>();
}

export function getPartnerName(book: DebtBook, myId: string): string {
  return myId === book.creditor_id
    ? (book.debtor_name || book.debtor_email)
    : (book.creditor_name || book.creditor_email);
}
