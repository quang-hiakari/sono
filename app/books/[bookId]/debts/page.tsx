import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBook } from '@/lib/queries/books';
import { getDebts } from '@/lib/queries/book-ledger';
import { DebtsList } from './components/debts-list';
import { PageContainer } from '@/components/shell/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props { params: Promise<{ bookId: string }> }

export default async function DebtsPage({ params }: Props) {
  const { bookId } = await params;
  const [me, book, debts] = await Promise.all([
    getCurrentUser(),
    getBook(bookId),
    getDebts(bookId),
  ]);
  if (!book) return null;
  const isCreditor = book.creditor_id === me!.id;

  return (
    <PageContainer>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tất cả khoản nợ</CardTitle>
          {isCreditor && (
            <Link href={`/books/${bookId}/debts/new?currency=${book.currency}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Plus size={14} /> Thêm mới
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <DebtsList debts={debts} bookId={bookId} isCreditor={isCreditor} currency={book.currency} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
