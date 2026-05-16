'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatVND } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { Debt } from '@/lib/queries/book-ledger';
import { EmptyState } from '@/components/states/empty-state';
import { deleteDebt } from '../actions';

interface Props {
  debts: Debt[];
  bookId: string;
  isCreditor: boolean;
}

export function DebtsList({ debts, bookId, isCreditor }: Props) {
  if (!debts.length) {
    return <EmptyState message="Chưa có khoản nợ nào. Bấm + để thêm." />;
  }

  async function handleDelete(id: string) {
    const result = await deleteDebt(bookId, id);
    if (result?.error) toast.error(result.error);
    else toast.success('Đã xoá khoản nợ.');
  }

  return (
    <div className="divide-y divide-gray-100">
      {debts.map((debt) => (
        <div key={debt.id} className="flex items-start gap-3 py-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate">{debt.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(debt.debt_date)}</p>
            {debt.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{debt.notes}</p>}
          </div>
          <p className="font-semibold text-red-600 shrink-0">{formatVND(debt.amount)}</p>
          {isCreditor && (
            <button
              onClick={() => handleDelete(debt.id)}
              className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
              aria-label="Xoá"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
