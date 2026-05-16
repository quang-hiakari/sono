import { headers } from 'next/headers';
import { createAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const auth = createAuth(getDB());
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
  };
}
