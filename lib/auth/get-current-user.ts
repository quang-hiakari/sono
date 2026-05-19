import { headers } from 'next/headers';
import { createAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const db = getDB();
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const profile = await db.prepare('SELECT full_name FROM profiles WHERE id = ?')
    .bind(session.user.id).first<{ full_name: string | null }>();
  return {
    id: session.user.id,
    email: session.user.email,
    name: profile?.full_name || session.user.name || session.user.email,
  };
}
