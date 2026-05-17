'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Props {
  bookId: string;
  currentName: string;
  currentDebtorName: string;
}

export function EditBookButton({ bookId, currentName, currentDebtorName }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/books/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: (fd.get('name') as string).trim(),
        debtor_display_name: (fd.get('debtor_display_name') as string).trim() || null,
      }),
    });
    const result = await res.json().catch(() => ({})) as { error?: string };
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Đã cập nhật sổ nợ.');
    setOpen(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
          <Pencil size={13} /> Chỉnh sửa
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="text-base font-semibold mb-4">Chỉnh sửa sổ nợ</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Tên sổ nợ *</label>
            <input name="name" required maxLength={100} defaultValue={currentName}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Tên người nợ</label>
            <input name="debtor_display_name" maxLength={80} defaultValue={currentDebtorName}
              placeholder="Để trống để dùng tên mặc định"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
              Huỷ
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
