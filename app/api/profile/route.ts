export const runtime = 'edge';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { upsertProfile } from '@/lib/queries/profile';

const schema = z.object({
  full_name: z.string().max(80).optional(),
  bank_name: z.string().max(100).optional(),
  account_number: z.string().max(30).optional(),
  account_holder: z.string().max(100).optional(),
});

export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  await upsertProfile(me.id, parsed.data);
  return Response.json({ ok: true });
}
