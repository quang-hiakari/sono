import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 text-slate-400 text-sm', className)}>
      {message}
    </div>
  );
}
