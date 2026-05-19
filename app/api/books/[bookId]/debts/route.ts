export const runtime = 'edge';

import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { revalidatePath } from 'next/cache';
import { sendDebtDeletedNotification } from '@/lib/email/send-debt-deleted-notification';

const schema = z.object({
  title: z.string().min(1).max(120),
  amount: z.coerce.number().positive(),
  debt_date: z.string().optional(),
  notes: z.string().max(500).optional(),
  invoice_url: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const { bookId } = await params;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?')
    .bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id)
    return Response.json({ error: 'Không có quyền.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });

  const { title, amount, debt_date, notes, invoice_url } = parsed.data;
  const date = debt_date || new Date().toISOString().split('T')[0];

  await db.prepare(
    'INSERT INTO debts (id, book_id, creditor_id, title, amount, notes, debt_date, invoice_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), bookId, me.id, title, amount, notes ?? null, date, invoice_url ?? null).run();

  revalidatePath(`/books/${bookId}`);
  revalidatePath(`/books/${bookId}/debts`);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const { bookId } = await params;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id, debtor_id, name, currency FROM debt_books WHERE id = ?')
    .bind(bookId).first<{ creditor_id: string; debtor_id: string; name: string; currency: string }>();
  if (!book || book.creditor_id !== me.id)
    return Response.json({ error: 'Không có quyền.' }, { status: 403 });

  const { debtId, reason } = await req.json() as { debtId: string; reason?: string };
  if (!debtId) return Response.json({ error: 'Thiếu debtId.' }, { status: 400 });

  const debt = await db.prepare('SELECT title, amount FROM debts WHERE id = ? AND book_id = ?')
    .bind(debtId, bookId).first<{ title: string; amount: number }>();

  await db.prepare('UPDATE debts SET deleted_at = ?, delete_reason = ? WHERE id = ? AND book_id = ?')
    .bind(Date.now(), reason?.trim() || null, debtId, bookId).run();

  // Notify debtor (best-effort)
  if (debt) {
    try {
      const debtor = await db.prepare('SELECT email FROM "user" WHERE id = ?')
        .bind(book.debtor_id).first<{ email: string }>();
      if (debtor?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
        await sendDebtDeletedNotification({
          to: debtor.email,
          creditorName: me.name || me.email,
          bookName: book.name,
          debtTitle: debt.title,
          amount: Number(debt.amount),
          currency: book.currency,
          reason: reason?.trim() || null,
          dashboardUrl: `${appUrl}/books/${bookId}`,
        });
      }
    } catch (err) {
      console.error('[deleteDebt] notification failed:', err);
    }
  }

  revalidatePath(`/books/${bookId}`);
  revalidatePath(`/books/${bookId}/debts`);
  return Response.json({ ok: true });
}
