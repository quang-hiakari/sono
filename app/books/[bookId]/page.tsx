import Link from 'next/link';
import { Plus, Clock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBook } from '@/lib/queries/books';
import { getLedgerTotals, getDebts, getPendingPayments, getMyPayments } from '@/lib/queries/book-ledger';
import { formatVND } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { PageContainer } from '@/components/shell/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/states/empty-state';

interface Props { params: Promise<{ bookId: string }> }

export default async function BookPage({ params }: Props) {
  const { bookId } = await params;
  const me = await getCurrentUser();
  const book = await getBook(bookId);
  if (!book) return null;

  const isCreditor = book.creditor_id === me!.id;

  const [totals, recentDebts] = await Promise.all([
    getLedgerTotals(bookId),
    getDebts(bookId),
  ]);
  const debtSlice = recentDebts.slice(0, 5);

  // Creditor fetches pending; debtor fetches own payments
  const pendingPayments = isCreditor ? await getPendingPayments(bookId) : [];
  const myPayments = !isCreditor ? await getMyPayments(bookId, me!.id) : [];
  const myRecentPayments = myPayments.slice(0, 3);

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Summary card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 mb-1">Còn lại</p>
              <p className={`text-4xl font-bold ${totals.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatVND(totals.remaining)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Tổng nợ</p>
                <p className="font-semibold text-slate-800">{formatVND(totals.total)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Đã thanh toán</p>
                <p className="font-semibold text-green-600">{formatVND(totals.paid)}</p>
              </div>
            </div>
            {totals.pendingCount > 0 && (
              <div className="flex items-center justify-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg py-2 text-sm text-yellow-700">
                <Clock size={14} />
                <span>{totals.pendingCount} thanh toán chờ duyệt</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creditor: pending approvals */}
        {isCreditor && pendingPayments.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="text-base text-yellow-700">Chờ duyệt ({pendingPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/books/${bookId}/payments`} className="text-sm text-blue-600 hover:underline">
                Xem và duyệt thanh toán →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Creditor: recent debts */}
        {isCreditor && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Khoản nợ gần đây</CardTitle>
              <Link href={`/books/${bookId}/debts/new`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <Plus size={14} /> Thêm
              </Link>
            </CardHeader>
            <CardContent>
              {debtSlice.length === 0 ? (
                <EmptyState message="Chưa có khoản nợ nào. Bấm + để thêm." />
              ) : (
                <div className="divide-y divide-gray-100">
                  {debtSlice.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{d.title}</p>
                        <p className="text-xs text-slate-400">{formatDate(d.debt_date)}</p>
                      </div>
                      <p className="font-semibold text-red-600 text-sm">{formatVND(d.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
              {recentDebts.length > 5 && (
                <Link href={`/books/${bookId}/debts`} className="block text-center text-sm text-blue-600 mt-3 hover:underline">
                  Xem tất cả →
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Debtor: pay now CTA + recent payments */}
        {!isCreditor && (
          <>
            <Button asChild className="w-full" size="lg">
              <Link href={`/books/${bookId}/payments/new`}>
                <Plus size={18} /> Trả nợ ngay
              </Link>
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thanh toán gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                {myRecentPayments.length === 0 ? (
                  <EmptyState message="Bạn chưa có lịch sử thanh toán." />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {myRecentPayments.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{formatVND(p.amount)}</p>
                          <p className="text-xs text-slate-400">{formatDate(p.created_at)}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          p.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.status === 'pending' ? 'Chờ duyệt' : p.status === 'approved' ? 'Đã duyệt' : 'Bị từ chối'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {myPayments.length > 3 && (
                  <Link href={`/books/${bookId}/payments`} className="block text-center text-sm text-blue-600 mt-3 hover:underline">
                    Xem tất cả →
                  </Link>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  );
}
