import { redirect } from 'next/navigation';
import { createAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  const auth = createAuth(getDB());
  await auth.api.signOut({ headers: req.headers });
  redirect('/login');
}
