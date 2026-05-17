import Link from 'next/link';
import { PlusCircle, ExternalLink } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBook } from '@/lib/queries/books';
import { getAllPayments, getPendingPayments, getMyPayments } from '@/lib/queries/book-ledger';
import { getPresignedUrls } from '@/lib/r2-presign';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { PageContainer } from '@/components/shell/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states/empty-state';
import { PaymentApprovalCard } from './components/payment-approval-card';
import { PaymentStatusBadge } from './components/payment-status-badge';

interface Props { params: Promise<{ bookId: string }> }

export default async function PaymentsPage({ params }: Props) {
  const { bookId } = await params;
  const [me, book] = await Promise.all([getCurrentUser(), getBook(bookId)]);
  if (!book) return null;

  const isCreditor = book.creditor_id === me!.id;

  if (isCreditor) {
    const [pending, all] = await Promise.all([
      getPendingPayments(bookId),
      getAllPayments(bookId),
    ]);
    const approved = all.filter(p => p.status === 'approved');
    const signedUrls = await getPresignedUrls(pending.map(p => p.receipt_url));

    return (
      <PageContainer>
        <div className="space-y-4">
          {pending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-yellow-700">Chờ duyệt ({pending.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pending.map(p => (
                  <PaymentApprovalCard
                    key={p.id}
                    payment={p}
                    bookId={bookId}
                    receiptUrl={p.receipt_url ? (signedUrls[p.receipt_url] ?? null) : null}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Đã duyệt</CardTitle>
            </CardHeader>
            <CardContent>
              {approved.length === 0 ? (
                <EmptyState message="Chưa có thanh toán nào được duyệt." />
              ) : (
                <div className="divide-y divide-gray-100">
                  {approved.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-green-600">{formatAmount(p.amount, book.currency)}</p>
                        <p className="text-xs text-slate-400">{formatDate(p.created_at)}</p>
                        {p.note && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.note}</p>}
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Debtor view
  const payments = await getMyPayments(bookId, me!.id);
  const signedUrls = await getPresignedUrls(payments.map(p => p.receipt_url));

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link
          href={`/books/${bookId}/payments/new`}
          className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
        >
          <PlusCircle size={18} /> Trả nợ mới
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch sử thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <EmptyState message="Bạn chưa có lịch sử thanh toán." />
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map(p => {
                  const receiptUrl = p.receipt_url ? (signedUrls[p.receipt_url] ?? null) : null;
                  return (
                    <div key={p.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800">{formatAmount(p.amount, book.currency)}</p>
                          <p className="text-xs text-slate-400">{formatDate(p.created_at)}</p>
                          {p.note && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.note}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <PaymentStatusBadge status={p.status} />
                          {receiptUrl && (
                            <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline">
                              Biên lai <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                      {p.status === 'rejected' && p.rejection_reason && (
                        <p className="text-xs text-red-500 italic pl-0.5">
                          Lý do: {p.rejection_reason}
                        </p>
                      )}
                      {p.status === 'rejected' && (
                        <Link href={`/books/${bookId}/payments/new`}
                          className="text-xs text-blue-600 hover:underline">
                          Nộp lại →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
