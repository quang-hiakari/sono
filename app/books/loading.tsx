import { SkeletonCard } from '@/components/states/skeleton-card';
import { PageContainer } from '@/components/shell/page-container';

export default function BooksLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-14 bg-white border-b border-gray-200" />
      <PageContainer>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </PageContainer>
    </div>
  );
}
