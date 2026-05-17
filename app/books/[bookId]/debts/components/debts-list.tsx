'use client';

import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { Debt } from '@/lib/queries/book-ledger';
import { EmptyState } from '@/components/states/empty-state';
import { ReceiptDialog } from '../../payments/components/receipt-dialog';

interface Props {
  debts: Debt[];
  bookId: string;
  isCreditor: boolean;
  currency: string;
}

export function DebtsList({ debts, bookId, isCreditor, currency }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!debts.length) return <EmptyState message="Chưa có khoản nợ nào. Bấm + để thêm." />;

  async function handleDelete(id: string) {
    if (!window.confirm('Xoá khoản nợ này?')) return;
    const res = await fetch(`/api/books/${bookId}/debts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debtId: id }),
    });
    const result = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || result.error) toast.error(result.error || 'Có lỗi xảy ra.');
    else { toast.success('Đã xoá khoản nợ.'); window.location.reload(); }
  }

  async function handleSaveNotes(debtId: string, notes: string) {
    setSaving(true);
    const res = await fetch(`/api/books/${bookId}/debts/${debtId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes.trim() || null }),
    });
    const result = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
    setSaving(false);
    if (!res.ok || result.error) toast.error(result.error || 'Có lỗi xảy ra.');
    else { toast.success('Đã cập nhật ghi chú.'); setEditingId(null); window.location.reload(); }
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {debts.map((debt) => (
        <div key={debt.id} className="py-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 dark:text-white truncate">{debt.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(debt.debt_date)}</p>
              {editingId === debt.id ? (
                <NotesEditor
                  defaultValue={debt.notes ?? ''}
                  saving={saving}
                  onSave={notes => handleSaveNotes(debt.id, notes)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                debt.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{debt.notes}</p>
              )}
              {debt.invoice_url && editingId !== debt.id && (
                <div className="mt-1">
                  <ReceiptDialog receiptPath={debt.invoice_url} label="Xem hoá đơn" />
                </div>
              )}
            </div>
            {editingId !== debt.id && (
              <>
                <p className="font-semibold text-red-600 dark:text-red-400 shrink-0 text-sm">
                  {formatAmount(debt.amount, currency)}
                </p>
                {isCreditor && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingId(debt.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Sửa ghi chú">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(debt.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesEditor({ defaultValue, saving, onSave, onCancel }: {
  defaultValue: string;
  saving: boolean;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="mt-2 space-y-2">
      <textarea value={value} onChange={e => setValue(e.target.value)} rows={2} maxLength={500}
        placeholder="Ghi chú..."
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
      <div className="flex gap-2">
        <button onClick={() => onSave(value)} disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
          <Check size={12} /> {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs hover:bg-slate-50">
          <X size={12} /> Huỷ
        </button>
      </div>
    </div>
  );
}
