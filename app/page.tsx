import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export default async function HomePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  redirect('/books');
}
