'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteWithReasonDialogProps {
  title: string;
  description: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function DeleteWithReasonDialog({
  title,
  description,
  reasonLabel = 'Lý do xoá',
  reasonPlaceholder = 'VD: Đã trả hết, nhập sai...',
  reasonRequired = true,
  confirmLabel = 'Xoá',
  loading = false,
  onConfirm,
  onCancel,
}: DeleteWithReasonDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const canConfirm = !reasonRequired || reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={() => !loading && onCancel()}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#18181f] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <Trash2 size={16} className="text-red-500 dark:text-red-400" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-base">{title}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-500 dark:text-white/45 leading-relaxed">{description}</p>

          {/* Reason textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/45">
              {reasonLabel} <span className="text-red-400 ml-0.5">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              maxLength={200}
              rows={2}
              disabled={loading}
              className="w-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-red-400/60 dark:focus:border-red-400/40 transition-colors resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/[0.05] disabled:opacity-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => canConfirm && onConfirm(reason.trim())}
            disabled={loading || !canConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Đang xoá...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
