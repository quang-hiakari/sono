'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm('Xoá sổ nợ này? Tất cả khoản nợ và thanh toán sẽ bị xoá vĩnh viễn.')) return;
    setLoading(true);
    const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
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
    <button
      onClick={handleDelete}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors"
    >
      <Trash2 size={15} />
      {loading ? 'Đang xoá...' : 'Xoá sổ nợ'}
    </button>
  );
}
