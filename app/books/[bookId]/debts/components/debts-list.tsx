'use client';

import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { Debt } from '@/lib/queries/book-ledger';
import { EmptyState } from '@/components/states/empty-state';
import { ReceiptDialog } from '../../payments/components/receipt-dialog';
import { DeleteWithReasonDialog } from '@/components/ui/delete-with-reason-dialog';

interface Props {
  debts: Debt[];
  bookId: string;
  isCreditor: boolean;
  currency: string;
}

export function DebtsList({ debts, bookId, isCreditor, currency }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeDebts = debts.filter(d => !d.deleted_at);
  const deletedDebts = debts.filter(d => !!d.deleted_at);

  if (!debts.length) return <EmptyState message="Chưa có khoản nợ nào. Bấm + để thêm." />;

  async function handleDelete(id: string, reason: string) {
    setDeleting(true);
    const res = await fetch(`/api/books/${bookId}/debts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debtId: id, reason }),
    });
    setDeleting(false);
    const result = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || result.error) toast.error(result.error || 'Có lỗi xảy ra.');
    else { setDeletingId(null); toast.success('Đã xoá khoản nợ.'); window.location.reload(); }
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
    <>
      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {/* Active debts */}
        {activeDebts.map((debt) => (
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
                      <button onClick={() => setDeletingId(debt.id)}
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

        {/* Deleted debts */}
        {deletedDebts.map((debt) => (
          <div key={debt.id} className="py-3 opacity-55">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-400 dark:text-white/30 truncate line-through">
                    {debt.title}
                  </p>
                  <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
                    Đã xoá
                  </span>
                </div>
                <p className="text-xs text-slate-300 dark:text-white/20 mt-0.5">{formatDate(debt.debt_date)}</p>
                {debt.delete_reason && (
                  <p className="text-xs text-slate-400 dark:text-white/25 mt-0.5 italic">
                    Lý do: {debt.delete_reason}
                  </p>
                )}
              </div>
              <p className="font-semibold text-slate-300 dark:text-white/20 shrink-0 text-sm line-through">
                {formatAmount(debt.amount, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {deletingId && (
        <DeleteWithReasonDialog
          title="Xoá khoản nợ"
          description="Khoản nợ sẽ bị đánh dấu đã xoá. Cả hai bên vẫn có thể xem nhưng không thể khôi phục."
          reasonPlaceholder="VD: Đã trả hết, nhập sai..."
          onConfirm={(reason) => handleDelete(deletingId, reason)}
          onCancel={() => setDeletingId(null)}
          loading={deleting}
        />
      )}
    </>
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
