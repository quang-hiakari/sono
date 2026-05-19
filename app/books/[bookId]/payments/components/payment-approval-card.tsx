'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { Payment } from '@/lib/queries/book-ledger';
import { ReceiptDialog } from './receipt-dialog';

interface Props {
  payment: Payment;
  bookId: string;
  currency: string;
}

export function PaymentApprovalCard({ payment, bookId, currency }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const t = useTranslations('payment');
  const tc = useTranslations('common');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);


  async function callAction(action: 'approve' | 'reject') {
    setLoading(action);
    const res = await fetch(`/api/books/${bookId}/payments/${payment.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: reason.trim() || undefined }),
    });
    const result = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
    if (!res.ok || result.error) {
      toast.error(result.error || tc('error'));
      setLoading(null);
    } else {
      toast.success(action === 'approve' ? t('approveSuccess') : t('rejectSuccess'));
      setDone(true);
    }
  }

  if (done) return null;

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">{formatAmount(payment.amount, currency)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(payment.created_at)}</p>
          {payment.note && <p className="text-xs text-slate-600 mt-1 italic">&ldquo;{payment.note}&rdquo;</p>}
        </div>
        {payment.receipt_url && <ReceiptDialog receiptPath={payment.receipt_url} />}
      </div>

      {!showRejectForm ? (
        <div className="flex gap-2">
          <button onClick={() => callAction('approve')} disabled={loading !== null}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            <Check size={15} /> {loading === 'approve' ? t('approving') : t('approve')}
          </button>
          <button onClick={() => setShowRejectForm(true)} disabled={loading !== null}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200 hover:bg-red-100 disabled:opacity-50">
            <X size={15} /> {t('reject')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder={t('rejectReason')} maxLength={300} rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400" />
          <div className="flex gap-2">
            <button onClick={() => callAction('reject')} disabled={loading !== null}
              className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {loading === 'reject' ? t('rejecting') : t('confirmReject')}
            </button>
            <button onClick={() => { setShowRejectForm(false); setReason(''); }} disabled={loading !== null}
              className="h-10 px-4 rounded-lg border border-gray-300 text-sm text-slate-600 hover:bg-gray-50 disabled:opacity-50">
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
