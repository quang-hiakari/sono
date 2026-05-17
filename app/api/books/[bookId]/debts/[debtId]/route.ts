export const runtime = 'edge';

import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const schema = z.object({
  title: z.string().min(1).max(120).optional(),
  amount: z.coerce.number().positive().optional(),
  debt_date: z.string().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ bookId: string; debtId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const { bookId, debtId } = await params;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?')
    .bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id)
    return Response.json({ error: 'Không có quyền.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });

  const { title, amount, debt_date, notes } = parsed.data;
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
  if (amount !== undefined) { sets.push('amount = ?'); vals.push(amount); }
  if (debt_date !== undefined) { sets.push('debt_date = ?'); vals.push(debt_date); }
  if (notes !== undefined) { sets.push('notes = ?'); vals.push(notes); }
  if (!sets.length) return Response.json({ ok: true });

  vals.push(debtId, bookId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.prepare(`UPDATE debts SET ${sets.join(', ')} WHERE id = ? AND book_id = ?`) as any)
    .bind(...vals).run();

  return Response.json({ ok: true });
}
