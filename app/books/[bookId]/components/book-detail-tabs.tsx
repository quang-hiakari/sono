'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import type { Debt, Payment } from '@/lib/queries/book-ledger';
import { DebtsList } from '../debts/components/debts-list';
import { ReceiptDialog } from '../payments/components/receipt-dialog';
import { PaymentStatusBadge } from '../payments/components/payment-status-badge';
import { EmptyState } from '@/components/states/empty-state';

interface Props {
  bookId: string;
  currency: string;
  isCreditor: boolean;
  debts: Debt[];
  payments: Payment[];
}

export function BookDetailTabs({ bookId, currency, isCreditor, debts, payments }: Props) {
  const [tab, setTab] = useState<'debts' | 'payments'>('debts');
  const t = useTranslations('book');
  const tp = useTranslations('payment');
  const td = useTranslations('debt');
  const fmt = (n: number) => formatAmount(n, currency);

  const approvedPayments = isCreditor ? payments.filter(p => p.status === 'approved') : payments;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-white/[0.05] p-1 gap-1 mb-4">
        {[
          { id: 'debts' as const, label: t('tabs.debts'), count: debts.length },
          { id: 'payments' as const, label: t('tabs.payments'), count: approvedPayments.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'
            )}>
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                tab === t.id
                  ? 'bg-[#00c9a7]/20 text-[#00a88a] dark:text-[#00c9a7]'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/30'
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Khoản nợ tab */}
      {tab === 'debts' && (
        <div className="space-y-3">
          {isCreditor && (
            <Link href={`/books/${bookId}/debts/new?currency=${currency}`}
              className="flex items-center justify-center gap-1.5 w-full bg-[#00c9a7] hover:bg-[#00b498] text-[#0d0d0f] font-bold text-sm py-3 rounded-xl transition-colors">
              <Plus size={15} /> {td('addBtn')}
            </Link>
          )}
          <DebtsList debts={debts} bookId={bookId} isCreditor={isCreditor} currency={currency} />
        </div>
      )}

      {/* Thanh Toán tab */}
      {tab === 'payments' && (
        <div className="space-y-3">
          {!isCreditor && (
            <Link href={`/books/${bookId}/payments/new`}
              className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
              <PlusCircle size={18} /> {tp('new')}
            </Link>
          )}
          {approvedPayments.length === 0 ? (
            <EmptyState message={isCreditor ? tp('emptyApproved') : tp('empty')} />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {approvedPayments.map(p => (
                <div key={p.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{fmt(p.amount)}</p>
                      <p className="text-xs text-slate-400 dark:text-white/35">{formatDate(p.created_at)}</p>
                      {p.note && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.note}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <PaymentStatusBadge status={p.status} />
                      {p.receipt_url && <ReceiptDialog receiptPath={p.receipt_url} />}
                    </div>
                  </div>
                  {p.status === 'rejected' && p.rejection_reason && (
                    <p className="text-xs text-red-500 italic pl-0.5">Lý do: {p.rejection_reason}</p>
                  )}
                  {p.status === 'rejected' && !isCreditor && (
                    <Link href={`/books/${bookId}/payments/new`} className="text-xs text-blue-600 hover:underline">
                      Nộp lại →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
