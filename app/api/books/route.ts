export const runtime = 'edge';

import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { CURRENCIES } from '@/lib/format/currency';
import { sendInviteEmail } from '@/lib/email/send-invite-notification';

const BOOK_SELECT_WITH_LEDGER = `
  SELECT b.id, b.name, b.creditor_id, b.debtor_id, b.currency,
    b.debtor_display_name, b.created_at, b.deleted_at, b.delete_reason,
    c.email AS creditor_email, COALESCE(cp.full_name, NULLIF(c.name, '')) AS creditor_name,
    d.email AS debtor_email,
    COALESCE(b.debtor_display_name, dp.full_name, NULLIF(d.name, '')) AS debtor_name,
    (SELECT COALESCE(SUM(amount), 0) FROM debts WHERE book_id = b.id AND deleted_at IS NULL) AS total_debt,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE book_id = b.id AND status = 'approved') AS paid,
    (SELECT COUNT(*) FROM payments WHERE book_id = b.id AND status = 'pending') AS pending_count
  FROM debt_books b
  JOIN "user" c ON c.id = b.creditor_id
  JOIN "user" d ON d.id = b.debtor_id
  LEFT JOIN profiles cp ON cp.id = b.creditor_id
  LEFT JOIN profiles dp ON dp.id = b.debtor_id
`;

const currencyCodes = CURRENCIES.map(c => c.code) as [string, ...string[]];

const createSchema = z.object({
  name: z.string().min(1).max(100),
  debtor_email: z.string().email(),
  debtor_name: z.string().max(80).optional(),
  currency: z.enum(currencyCodes).default('VND'),
});

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDB();
  const { results } = await db.prepare(`
    ${BOOK_SELECT_WITH_LEDGER}
    WHERE (b.creditor_id = ? OR b.debtor_id = ?)
    ORDER BY b.created_at DESC
  `).bind(me.id, me.id).all<Record<string, unknown>>();

  const creditor = results.filter(b => b.creditor_id === me.id).map(b => ({
    ...b,
    role: 'creditor',
    remaining: Number(b.total_debt) - Number(b.paid),
  }));
  const debtor = results.filter(b => b.debtor_id === me.id).map(b => ({
    ...b,
    role: 'debtor',
    remaining: Number(b.total_debt) - Number(b.paid),
  }));

  return Response.json({ creditor, debtor });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid data.', issues: parsed.error.issues }, { status: 400 });

  const { name, debtor_email, debtor_name, currency } = parsed.data;

  if (debtor_email.toLowerCase() === me.email.toLowerCase()) {
    return Response.json({ error: 'Cannot create a book with yourself.' }, { status: 422 });
  }

  const db = getDB();
  let debtor = await db.prepare('SELECT id, email FROM "user" WHERE email = ? COLLATE NOCASE')
    .bind(debtor_email).first<{ id: string; email: string }>();

  const isNewUser = !debtor;
  if (!debtor) {
    const debtorId = crypto.randomUUID();
    const now = Date.now();
    await db.batch([
      db.prepare('INSERT INTO "user" (id, email, name, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?)')
        .bind(debtorId, debtor_email, debtor_email.split('@')[0], now, now),
      db.prepare('INSERT INTO profiles (id) VALUES (?)')
        .bind(debtorId),
    ]);
    debtor = { id: debtorId, email: debtor_email };
  }

  const id = crypto.randomUUID();
  try {
    await db.prepare('INSERT INTO debt_books (id, name, creditor_id, debtor_id, currency, debtor_display_name) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, name, me.id, debtor.id, currency, debtor_name ?? null).run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('UNIQUE')) return Response.json({ error: 'You already have a book with this person.' }, { status: 409 });
    return Response.json({ error: msg || 'Failed to create book.' }, { status: 500 });
  }

  if (isNewUser) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      await sendInviteEmail({ to: debtor_email, creditorName: me.name || me.email, bookName: name, loginUrl: `${appUrl}/login` });
    } catch (err) {
      console.error('[POST /api/books] invite email failed:', err);
    }
  }

  return Response.json({ id, name, currency, debtor_id: debtor.id, debtor_email }, { status: 201 });
}
