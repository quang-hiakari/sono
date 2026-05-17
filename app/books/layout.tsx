export const runtime = 'edge';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { BottomNav } from '@/components/shell/bottom-nav';

export default async function BooksLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
