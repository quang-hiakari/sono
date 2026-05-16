'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const schema = z.object({
  name: z.string().min(1).max(100),
  debtorEmail: z.string().email(),
});

export async function createBook(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Chưa đăng nhập.' };

  const parsed = schema.safeParse({
    name: formData.get('name'),
    debtorEmail: formData.get('debtorEmail'),
  });
  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ.' };

  const { name, debtorEmail } = parsed.data;

  if (debtorEmail.toLowerCase() === me.email.toLowerCase()) {
    return { error: 'Không thể tạo sổ nợ với chính mình.' };
  }

  const db = getDB();

  const debtor = await db.prepare('SELECT id, email FROM "user" WHERE email = ? COLLATE NOCASE')
    .bind(debtorEmail).first<{ id: string; email: string }>();

  if (!debtor) {
    return { error: 'Người dùng chưa đăng ký. Họ cần tạo tài khoản trước.' };
  }

  const id = crypto.randomUUID();
  try {
    await db.prepare('INSERT INTO debt_books (id, name, creditor_id, debtor_id) VALUES (?, ?, ?, ?)')
      .bind(id, name, me.id, debtor.id).run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('UNIQUE')) return { error: 'Bạn đã có sổ nợ với người này rồi.' };
    return { error: msg || 'Không thể tạo sổ nợ.' };
  }

  redirect(`/books/${id}`);
}
