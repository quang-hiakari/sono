import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export default async function BooksLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  return <>{children}</>;
}
