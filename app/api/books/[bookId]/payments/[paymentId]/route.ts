export const runtime = 'edge';

import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { sendRejectionNotification } from '@/lib/email/send-rejection-notification';

export async function POST(req: Request, { params }: { params: Promise<{ bookId: string; paymentId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const { bookId, paymentId } = await params;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?')
    .bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id)
    return Response.json({ error: 'Không có quyền.' }, { status: 403 });

  const { action, reason } = await req.json() as { action: 'approve' | 'reject'; reason?: string };

  if (action === 'approve') {
    await db.prepare('UPDATE payments SET status = ?, reviewed_at = ? WHERE id = ? AND book_id = ?')
      .bind('approved', new Date().toISOString(), paymentId, bookId).run();
    return Response.json({ ok: true });
  }

  if (action === 'reject') {
    const payment = await db.prepare('SELECT amount, debtor_id FROM payments WHERE id = ? AND book_id = ?')
      .bind(paymentId, bookId).first<{ amount: number; debtor_id: string }>();
    await db.prepare('UPDATE payments SET status = ?, rejection_reason = ?, reviewed_at = ? WHERE id = ? AND book_id = ?')
      .bind('rejected', reason?.trim() || null, new Date().toISOString(), paymentId, bookId).run();
    if (payment) {
      try {
        const debtor = await db.prepare('SELECT email FROM "user" WHERE id = ?')
          .bind(payment.debtor_id).first<{ email: string }>();
        if (debtor?.email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
          await sendRejectionNotification({
            to: debtor.email,
            creditorName: me.name || me.email,
            amount: Number(payment.amount),
            reason: reason?.trim() || null,
            dashboardUrl: `${appUrl}/books/${bookId}/payments`,
          });
        }
      } catch { /* non-blocking */ }
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Invalid action.' }, { status: 400 });
}
