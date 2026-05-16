import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getR2 } from '@/lib/r2';

export const runtime = 'edge';

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const blob = await req.blob();
  if (blob.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'Ảnh quá lớn (tối đa 5MB).' }, { status: 400 });
  }

  const path = `${me.id}/${crypto.randomUUID()}.jpg`;
  await getR2().put(path, blob, {
    httpMetadata: { contentType: 'image/jpeg' },
  });

  return Response.json({ path });
}
