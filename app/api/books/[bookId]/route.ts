export const runtime = 'edge';

import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  debtor_display_name: z.string().max(80).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const { bookId } = await params;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?')
    .bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id)
    return Response.json({ error: 'Không có quyền.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });

  const { name, debtor_display_name } = parsed.data;
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (name !== undefined) { sets.push('name = ?'); vals.push(name); }
  if (debtor_display_name !== undefined) { sets.push('debtor_display_name = ?'); vals.push(debtor_display_name); }
  if (sets.length) {
    vals.push(bookId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.prepare(`UPDATE debt_books SET ${sets.join(', ')} WHERE id = ?`) as any).bind(...vals).run();
  }
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const { bookId } = await params;
  const db = getDB();
  const book = await db.prepare('SELECT creditor_id FROM debt_books WHERE id = ?')
    .bind(bookId).first<{ creditor_id: string }>();
  if (!book || book.creditor_id !== me.id)
    return Response.json({ error: 'Không có quyền.' }, { status: 403 });

  await db.prepare('DELETE FROM debt_books WHERE id = ? AND creditor_id = ?')
    .bind(bookId, me.id).run();

  return Response.json({ ok: true });
}
