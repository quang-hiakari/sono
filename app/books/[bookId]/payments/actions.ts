'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { sendRejectionNotification } from '@/lib/email/send-rejection-notification';
import { sendPaymentNotification } from '@/lib/email/send-payment-notification';
import { getPresignedUrl } from '@/lib/r2-presign';

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
  receipt_path: z.string().min(1),
});

interface BookRow { creditor_id: string; debtor_id: string }

function revalidateBook(bookId: string) {
  revalidatePath(`/books/${bookId}`);
  revalidatePath(`/books/${bookId}/payments`);
}

export async function createPayment(bookId: string, formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Chưa đăng nhập.' };

  const db = getDB();
  const book = await db.prepare('SELECT creditor_id, debtor_id FROM debt_books WHERE id = ?').bind(bookId).first<BookRow>();
  if (!book || book.debtor_id !== me.id) return { error: 'Không có quyền.' };

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ.' };

  await db.prepare(
    'INSERT INTO payments (id, book_id, debtor_id, amount, note, receipt_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), bookId, me.id, parsed.data.amount, parsed.data.note ?? null, parsed.data.receipt_path, 'pending').run();

  // Notify creditor inline (best-effort)
  try {
    const creditor = await db.prepare('SELECT email, name FROM "user" WHERE id = ?').bind(book.creditor_id).first<{ email: string; name: string }>();
    if (creditor) {
      let receiptUrl: string | null = null;
      try { receiptUrl = await getPresignedUrl(parsed.data.receipt_path, 60 * 60 * 24 * 7); } catch { /* skip */ }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      await sendPaymentNotification({
        to: creditor.email,
        debtorName: me.name || me.email,
        amount: parsed.data.amount,
        note: parsed.data.note,
        createdAt: new Date().toISOString(),
        receiptUrl,
        approvalUrl: `${appUrl}/books/${bookId}/payments`,
      });
    }
  } catch (err) {
    console.error('[createPayment] notification failed:', err);
  }

  revalidateBook(bookId);
  return {};
}

export async function approvePayment(bookId: string, paymentId: string) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Chưa đăng nhập.' };

  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?').bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id) return { error: 'Không có quyền.' };

  await db.prepare('UPDATE payments SET status = ?, reviewed_at = ? WHERE id = ? AND book_id = ?')
    .bind('approved', new Date().toISOString(), paymentId, bookId).run();

  revalidateBook(bookId);
  return {};
}

export async function rejectPayment(bookId: string, paymentId: string, reason: string) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Chưa đăng nhập.' };

  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?').bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id) return { error: 'Không có quyền.' };

  const payment = await db.prepare('SELECT amount, debtor_id FROM payments WHERE id = ? AND book_id = ?')
    .bind(paymentId, bookId).first<{ amount: number; debtor_id: string }>();

  await db.prepare('UPDATE payments SET status = ?, rejection_reason = ?, reviewed_at = ? WHERE id = ? AND book_id = ?')
    .bind('rejected', reason.trim() || null, new Date().toISOString(), paymentId, bookId).run();

  // Notify debtor (best-effort)
  if (payment) {
    try {
      const debtor = await db.prepare('SELECT email FROM "user" WHERE id = ?').bind(payment.debtor_id).first<{ email: string }>();
      if (debtor?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
        await sendRejectionNotification({
          to: debtor.email,
          creditorName: me.name || me.email,
          amount: Number(payment.amount),
          reason: reason.trim() || null,
          dashboardUrl: `${appUrl}/books/${bookId}/payments`,
        });
      }
    } catch (err) {
      console.error('[rejectPayment] email failed:', err);
    }
  }

  revalidateBook(bookId);
  return {};
}
