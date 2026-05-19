'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { CurrencyAmountInput } from '@/components/ui/currency-amount-input';
import { compressImage } from '@/lib/upload/compress-image';
import { uploadReceipt } from '@/lib/upload/upload-receipt';

export function PaymentForm({ bookId, currency }: { bookId: string; currency: string }) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      toast.error(t('receiptTooBig'));
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // capture before any await
    if (!file) { toast.error(t('receiptRequired')); return; }
    setSubmitting(true);
    try {
      const compressed = await compressImage(file);
      const receiptPath = await uploadReceipt(compressed);
      const fd = new FormData(form);
      const res = await fetch(`/api/books/${bookId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(fd.get('amount')),
          note: fd.get('note') || undefined,
          receipt_path: receiptPath,
        }),
      });
      const result = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok || result.error) {
        throw new Error(result.error || `Lỗi ${res.status}`);
      } else {
        toast.success(t('sentSuccess'));
        router.push(`/books/${bookId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="amount">{t("amount")} ({currency}) *</Label>
        <CurrencyAmountInput
          currency={currency}
          name="amount"
          required
          disabled={submitting}
          placeholder="500,000"
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("receipt")} *</Label>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} disabled={submitting} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={submitting}
          className="w-full min-h-36 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors overflow-hidden"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full object-contain rounded-lg" />
          ) : (
            <><ImageIcon size={28} /><span className="text-sm">{t("receiptHint")}</span></>
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">{t("note")}</Label>
        <Textarea id="note" name="note" maxLength={500} placeholder={t("notePlaceholder")} rows={2} disabled={submitting} />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? t('sending') : t('send')}
      </Button>
    </form>
  );
}
