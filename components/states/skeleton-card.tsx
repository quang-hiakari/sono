import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-gray-100 p-4 space-y-3', className)}>
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-8 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 py-3">
      <div className="h-4 bg-gray-100 rounded flex-1" />
      <div className="h-4 bg-gray-100 rounded w-24" />
      <div className="h-4 bg-gray-100 rounded w-16" />
    </div>
  );
}
