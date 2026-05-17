import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBook } from '@/lib/queries/books';
import { PaymentForm } from '../components/payment-form';
import { PageContainer } from '@/components/shell/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props { params: Promise<{ bookId: string }> }

export default async function NewPaymentPage({ params }: Props) {
  const { bookId } = await params;
  const [me, book] = await Promise.all([getCurrentUser(), getBook(bookId)]);
  if (!book) return null;

  // Only debtor can submit payments
  if (book.debtor_id !== me!.id) redirect(`/books/${bookId}`);

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href={`/books/${bookId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={15} /> Quay lại
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gửi thanh toán</CardTitle>
          <p className="text-xs text-slate-400">Thanh toán sẽ hiển thị trạng thái &ldquo;chờ duyệt&rdquo; cho đến khi được xác nhận.</p>
        </CardHeader>
        <CardContent>
          <PaymentForm bookId={bookId} currency={book.currency} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
