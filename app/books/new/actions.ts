'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { sendInviteEmail } from '@/lib/email/send-invite-notification';
import { CURRENCIES } from '@/lib/format/currency';

const currencyCodes = CURRENCIES.map(c => c.code) as [string, ...string[]];

const schema = z.object({
  name: z.string().min(1).max(100),
  debtorEmail: z.string().email(),
  currency: z.enum(currencyCodes).default('VND'),
});

export async function createBook(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Chưa đăng nhập.' };

  const parsed = schema.safeParse({
    name: formData.get('name'),
    debtorEmail: formData.get('debtorEmail'),
    currency: formData.get('currency') || 'VND',
  });
  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ.' };

  const { name, debtorEmail, currency } = parsed.data;

  if (debtorEmail.toLowerCase() === me.email.toLowerCase()) {
    return { error: 'Không thể tạo sổ nợ với chính mình.' };
  }

  const db = getDB();
  let debtor = await db.prepare('SELECT id, email FROM "user" WHERE email = ? COLLATE NOCASE')
    .bind(debtorEmail).first<{ id: string; email: string }>();

  // Auto-create account for unknown email
  if (!debtor) {
    const debtorId = crypto.randomUUID();
    const now = Date.now();
    await db.batch([
      db.prepare(`INSERT INTO "user" (id, email, name, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?)`)
        .bind(debtorId, debtorEmail, debtorEmail.split('@')[0], now, now),
      db.prepare(`INSERT INTO profiles (id) VALUES (?)`)
        .bind(debtorId),
    ]);
    debtor = { id: debtorId, email: debtorEmail };

    // Send invite email (best-effort)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      await sendInviteEmail({
        to: debtorEmail,
        creditorName: me.name || me.email,
        bookName: name,
        loginUrl: `${appUrl}/login`,
      });
    } catch (err) {
      console.error('[createBook] invite email failed:', err);
    }
  }

  const id = crypto.randomUUID();
  try {
    await db.prepare('INSERT INTO debt_books (id, name, creditor_id, debtor_id, currency) VALUES (?, ?, ?, ?, ?)')
      .bind(id, name, me.id, debtor.id, currency).run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('UNIQUE')) return { error: 'Bạn đã có sổ nợ với người này rồi.' };
    return { error: msg || 'Không thể tạo sổ nợ.' };
  }

  redirect(`/books/${id}`);
}
