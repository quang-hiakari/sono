export const runtime = 'edge';

import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getR2 } from '@/lib/r2';

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const me = await getCurrentUser();
  if (!me) return new Response('Unauthorized', { status: 401 });

  const { path } = await params;
  const key = path.join('/');
  const obj = await getR2().get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  return new Response(obj.body as ReadableStream, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
