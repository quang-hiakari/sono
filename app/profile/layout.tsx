export const runtime = 'edge';
import { BottomNav } from '@/components/shell/bottom-nav';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
