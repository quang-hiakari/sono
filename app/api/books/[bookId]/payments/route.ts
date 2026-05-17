export const runtime = 'edge';

import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getPresignedUrl } from '@/lib/r2-presign';
import { sendPaymentNotification } from '@/lib/email/send-payment-notification';

const schema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
  receipt_path: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const { bookId } = await params;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id, debtor_id FROM debt_books WHERE id = ?')
    .bind(bookId).first<{ creditor_id: string; debtor_id: string }>();
  if (!book || book.debtor_id !== me.id)
    return Response.json({ error: 'Không có quyền.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });

  const { amount, note, receipt_path } = parsed.data;

  await db.prepare(
    'INSERT INTO payments (id, book_id, debtor_id, amount, note, receipt_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), bookId, me.id, amount, note ?? null, receipt_path, 'pending').run();

  // Notify creditor (best-effort)
  try {
    const creditor = await db.prepare('SELECT email, name FROM "user" WHERE id = ?')
      .bind(book.creditor_id).first<{ email: string; name: string }>();
    if (creditor) {
      let receiptUrl: string | null = null;
      try { receiptUrl = await getPresignedUrl(receipt_path, 60 * 60 * 24 * 7); } catch { /* skip */ }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      await sendPaymentNotification({
        to: creditor.email,
        debtorName: me.name || me.email,
        amount,
        note,
        createdAt: new Date().toISOString(),
        receiptUrl,
        approvalUrl: `${appUrl}/books/${bookId}/payments`,
      });
    }
  } catch { /* non-blocking */ }

  return Response.json({ ok: true });
}
