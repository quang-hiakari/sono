import { Clock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBook } from '@/lib/queries/books';
import { getLedgerTotals, getDebts, getAllPayments, getMyPayments } from '@/lib/queries/book-ledger';
import { getProfile } from '@/lib/queries/profile';
import { formatAmount } from '@/lib/format/currency';
import { getT } from '@/lib/i18n';
import { PageContainer } from '@/components/shell/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { BankingInfoPanel } from './components/banking-info-panel';
import { DeleteBookButton } from './components/delete-book-button';
import { EditBookButton } from './components/edit-book-button';
import { BookDetailTabs } from './components/book-detail-tabs';

interface Props { params: Promise<{ bookId: string }> }

export default async function BookPage({ params }: Props) {
  const { bookId } = await params;
  const me = await getCurrentUser();
  const book = await getBook(bookId);
  if (!book) return null;

  const isCreditor = book.creditor_id === me!.id;
  const fmt = (n: number) => formatAmount(n, book.currency);

  const [totals, debts, creditorProfile, payments] = await Promise.all([
    getLedgerTotals(bookId),
    getDebts(bookId),
    getProfile(book.creditor_id),
    isCreditor ? getAllPayments(bookId) : getMyPayments(bookId, me!.id),
  ]);

  const bankingProfile = creditorProfile ? {
    bank_name: creditorProfile.bank_name,
    branch_name: creditorProfile.branch_name,
    account_number: creditorProfile.account_number,
    account_holder: creditorProfile.account_holder,
    creditor_id: book.creditor_id,
    has_qr: !!creditorProfile.bank_qr_url,
  } : null;

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const t = await getT('book');

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Summary card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {isCreditor && (
              <div className="flex justify-end">
                <EditBookButton bookId={bookId} currentName={book.name} currentDebtorName={book.debtor_name || ''} />
              </div>
            )}
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 mb-1">{t('remaining')}</p>
              <p className={`text-4xl font-bold ${totals.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fmt(totals.remaining)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">{t('totalDebt')}</p>
                <p className="font-semibold text-slate-800">{fmt(totals.total)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">{t('paid')}</p>
                <p className="font-semibold text-green-600">{fmt(totals.paid)}</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center justify-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg py-2 text-sm text-yellow-700">
                <Clock size={14} />
                <span>{t('pendingApproval', { count: String(pendingCount) })}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banking info */}
        <BankingInfoPanel profile={bankingProfile} />

        {/* Tabs: Khoản nợ / Thanh Toán */}
        <BookDetailTabs
          bookId={bookId}
          currency={book.currency}
          isCreditor={isCreditor}
          debts={debts}
          payments={payments}
        />

        {/* Danger zone */}
        {isCreditor && <DeleteBookButton bookId={bookId} />}
      </div>
    </PageContainer>
  );
}
