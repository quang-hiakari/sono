'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const debtSchema = z.object({
  title: z.string().min(1).max(120),
  amount: z.coerce.number().positive(),
  debt_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

async function verifyCreditor(bookId: string) {
  const me = await getCurrentUser();
  if (!me) return null;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?').bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id) return null;
  return { me, db };
}

function revalidateBook(bookId: string) {
  revalidatePath(`/books/${bookId}`);
  revalidatePath(`/books/${bookId}/debts`);
}

export async function createDebt(bookId: string, formData: FormData) {
  const ctx = await verifyCreditor(bookId);
  if (!ctx) return { error: 'Không có quyền.' };

  const parsed = debtSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ.' };

  const { title, amount, debt_date, notes } = parsed.data;
  const date = debt_date || new Date().toISOString().split('T')[0];

  await ctx.db.prepare(
    'INSERT INTO debts (id, book_id, creditor_id, title, amount, notes, debt_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), bookId, ctx.me.id, title, amount, notes ?? null, date).run();

  revalidateBook(bookId);
  return {};
}

// useActionState-compatible: bookId via hidden _bookId, date via debt_date_display (dd/mm/yyyy)
export async function createDebtFormAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const bookId = formData.get('_bookId') as string;
  const display = formData.get('debt_date_display') as string | null;
  if (display) {
    const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    formData.set('debt_date', m ? `${m[3]}-${m[2]}-${m[1]}` : new Date().toISOString().split('T')[0]);
  }
  return createDebt(bookId, formData);
}

export async function deleteDebt(bookId: string, debtId: string) {
  const ctx = await verifyCreditor(bookId);
  if (!ctx) return { error: 'Không có quyền.' };

  await ctx.db.prepare('DELETE FROM debts WHERE id = ? AND book_id = ?').bind(debtId, bookId).run();

  revalidateBook(bookId);
  return {};
}
