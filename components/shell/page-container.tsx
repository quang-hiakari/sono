import { cn } from '@/lib/utils';

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn('max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-8', className)}>
      {children}
    </main>
  );
}
