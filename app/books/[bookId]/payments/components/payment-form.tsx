'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { compressImage } from '@/lib/upload/compress-image';
import { uploadReceipt } from '@/lib/upload/upload-receipt';
import { createPayment } from '../actions';

export function PaymentForm({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 5MB).');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) { toast.error('Vui lòng chọn ảnh biên lai.'); return; }
    setSubmitting(true);
    try {
      const compressed = await compressImage(file);
      const receiptPath = await uploadReceipt(compressed);
      const formData = new FormData(e.currentTarget);
      formData.set('receipt_path', receiptPath);
      const result = await createPayment(bookId, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Đã gửi thanh toán! Chờ duyệt.');
        router.push(`/books/${bookId}`);
      }
    } catch {
      toast.error('Tải ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="amount">Số tiền (VNĐ) *</Label>
        <Input id="amount" name="amount" type="number" required min={1} step={1000} inputMode="numeric" placeholder="500000" disabled={submitting} />
      </div>

      <div className="space-y-1.5">
        <Label>Ảnh biên lai *</Label>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} disabled={submitting} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={submitting}
          className="w-full h-36 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors overflow-hidden"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <><ImageIcon size={28} /><span className="text-sm">Chụp hoặc chọn ảnh</span></>
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Ghi chú</Label>
        <Textarea id="note" name="note" maxLength={500} placeholder="Ghi chú thêm (không bắt buộc)" rows={2} disabled={submitting} />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Đang gửi...' : 'Gửi thanh toán'}
      </Button>
    </form>
  );
}
