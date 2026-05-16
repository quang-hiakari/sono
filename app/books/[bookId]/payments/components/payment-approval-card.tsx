'use client';

import { useState } from 'react';
import { ExternalLink, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatVND } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { Payment } from '@/lib/queries/book-ledger';
import { approvePayment, rejectPayment } from '../actions';

interface Props {
  payment: Payment;
  bookId: string;
  receiptUrl: string | null;
}

export function PaymentApprovalCard({ payment, bookId, receiptUrl }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');

  async function handleApprove() {
    setLoading('approve');
    const result = await approvePayment(bookId, payment.id);
    if (result?.error) toast.error(result.error);
    else toast.success('Đã duyệt thanh toán.');
    setLoading(null);
  }

  async function handleReject() {
    setLoading('reject');
    const result = await rejectPayment(bookId, payment.id, reason);
    if (result?.error) {
      toast.error(result.error);
      setLoading(null);
    } else {
      toast.success('Đã từ chối thanh toán.');
    }
  }

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">{formatVND(payment.amount)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(payment.created_at)}</p>
          {payment.note && <p className="text-xs text-slate-600 mt-1 italic">&ldquo;{payment.note}&rdquo;</p>}
        </div>
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
            Biên lai <ExternalLink size={11} />
          </a>
        )}
      </div>

      {!showRejectForm ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Check size={15} /> {loading === 'approve' ? 'Đang duyệt...' : 'Duyệt'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading !== null}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200 hover:bg-red-100 disabled:opacity-50"
          >
            <X size={15} /> Từ chối
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Lý do từ chối (không bắt buộc)"
            maxLength={300}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading !== null}
              className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {loading === 'reject' ? 'Đang từ chối...' : 'Xác nhận từ chối'}
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setReason(''); }}
              disabled={loading !== null}
              className="h-10 px-4 rounded-lg border border-gray-300 text-sm text-slate-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
