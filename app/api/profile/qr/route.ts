export const runtime = 'edge';

import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getR2 } from '@/lib/r2';
import { upsertProfile } from '@/lib/queries/profile';

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const blob = await req.blob();
  if (blob.size === 0) return Response.json({ error: 'Không có ảnh.' }, { status: 400 });
  if (blob.size > 3 * 1024 * 1024) return Response.json({ error: 'Ảnh quá lớn (tối đa 3MB).' }, { status: 400 });

  const path = `qr/${me.id}.jpg`;
  await getR2().put(path, blob, { httpMetadata: { contentType: 'image/jpeg' } });
  await upsertProfile(me.id, { bank_qr_url: path });

  return Response.json({ ok: true });
}
