'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteWithReasonDialog } from '@/components/ui/delete-with-reason-dialog';

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete(reason: string) {
    setLoading(true);
    const res = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const result = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || result.error) {
      toast.error(result.error || 'Có lỗi xảy ra.');
      setLoading(false);
    } else {
      toast.success('Đã xoá sổ nợ.');
      router.push('/books');
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors"
      >
        <Trash2 size={15} />
        Xoá sổ nợ
      </button>

      {showDialog && (
        <DeleteWithReasonDialog
          title="Xoá sổ nợ"
          description="Sổ nợ sẽ bị đánh dấu đã xoá. Cả hai bên vẫn có thể xem lịch sử nhưng không thể khôi phục."
          reasonPlaceholder="VD: Đã tất toán, tạo nhầm..."
          onConfirm={handleDelete}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      )}
    </>
  );
}
