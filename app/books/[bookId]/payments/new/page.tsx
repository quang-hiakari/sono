import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBook } from '@/lib/queries/books';
import { getDebts, getLedgerTotals } from '@/lib/queries/book-ledger';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { PaymentForm } from '../components/payment-form';
import { PageContainer } from '@/components/shell/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props { params: Promise<{ bookId: string }> }

export default async function NewPaymentPage({ params }: Props) {
  const { bookId } = await params;
  const [me, book] = await Promise.all([getCurrentUser(), getBook(bookId)]);
  if (!book) return null;
  if (book.debtor_id !== me!.id) redirect(`/books/${bookId}`);

  const [debts, totals] = await Promise.all([getDebts(bookId), getLedgerTotals(bookId)]);
  const fmt = (n: number) => formatAmount(n, book.currency);

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href={`/books/${bookId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={15} /> Quay lại
        </Link>
      </div>

      {/* Debt summary */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Khoản nợ cần thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y divide-gray-100">
            {debts.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.title}</p>
                  <p className="text-xs text-slate-400">{formatDate(d.debt_date)}</p>
                </div>
                <p className="text-sm font-semibold text-red-600">{fmt(d.amount)}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-sm text-slate-500">Còn lại cần trả</span>
            <span className="font-bold text-lg text-red-600">{fmt(totals.remaining)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment form */}
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
