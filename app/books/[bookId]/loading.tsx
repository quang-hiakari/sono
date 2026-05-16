import { SkeletonCard, SkeletonRow } from '@/components/states/skeleton-card';
import { PageContainer } from '@/components/shell/page-container';

export default function BookLoading() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <SkeletonCard />
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </PageContainer>
  );
}
