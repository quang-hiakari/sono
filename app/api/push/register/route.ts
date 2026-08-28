export const runtime = 'edge';

import { z } from 'zod';
import { getDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['android', 'ios']),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid data.' }, { status: 400 });

  const { token, platform } = parsed.data;
  const db = getDB();

  await db.prepare(`
    INSERT INTO device_tokens (id, user_id, token, platform)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, token) DO UPDATE SET platform = excluded.platform
  `).bind(crypto.randomUUID(), me.id, token, platform).run();

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await req.json().catch(() => ({})) as { token?: string };
  if (!token) return Response.json({ error: 'Missing token.' }, { status: 400 });

  const db = getDB();
  await db.prepare('DELETE FROM device_tokens WHERE user_id = ? AND token = ?')
    .bind(me.id, token).run();

  return Response.json({ ok: true });
}
