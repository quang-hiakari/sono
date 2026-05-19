'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyAmountInput } from '@/components/ui/currency-amount-input';
import { PageContainer } from '@/components/shell/page-container';
import { useTranslations } from 'next-intl';
import { compressImage } from '@/lib/upload/compress-image';
import { uploadReceipt } from '@/lib/upload/upload-receipt';

interface Props { bookId: string; currency: string; }

export function DebtForm({ bookId, currency }: Props) {
  const t = useTranslations('debt');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split('T')[0];
  const [yy, mm, dd] = today.split('-');
  const todayDisplay = `${dd}/${mm}/${yy}`;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t('invoiceTooBig') || 'Ảnh quá lớn'); return; }
    setInvoiceFile(file);
    setInvoicePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const fd = new FormData(form);
      const display = fd.get('debt_date_display') as string;
      const match = display?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const debt_date = match ? `${match[3]}-${match[2]}-${match[1]}` : today;

      let invoice_url: string | undefined;
      if (invoiceFile) {
        const compressed = await compressImage(invoiceFile);
        invoice_url = await uploadReceipt(compressed);
      }

      const res = await fetch(`/api/books/${bookId}/debts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fd.get('title'),
          amount: Number(fd.get('amount')),
          debt_date,
          notes: fd.get('notes') || undefined,
          invoice_url,
        }),
      });
      const result = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || result?.error) {
        toast.error(result?.error || tc('error'));
      } else {
        toast.success(t('addSuccess'));
        form.reset();
        setInvoiceFile(null);
        setInvoicePreview(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('error'));
    }
    setLoading(false);
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href={`/books/${bookId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={15} /> {tc("back")}
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("new")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("name")} *</Label>
              <Input id="title" name="title" required maxLength={120} placeholder={t("namePlaceholder")} autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("amount")} ({currency}) *</Label>
              <CurrencyAmountInput currency={currency} name="amount" required placeholder="500,000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt_date_display">{t("date")}</Label>
              <Input id="debt_date_display" name="debt_date_display" type="text" inputMode="numeric"
                defaultValue={todayDisplay} placeholder="dd/mm/yyyy" pattern="\d{2}/\d{2}/\d{4}" maxLength={10} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea id="notes" name="notes" maxLength={500} placeholder={t("notesPlaceholder")} rows={2} />
            </div>

            {/* Optional invoice photo */}
            <div className="space-y-1.5">
              <Label>{t("invoice")} <span className="text-slate-400 font-normal">{t("invoiceOptional")}</span></Label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
                className="w-full min-h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors overflow-hidden">
                {invoicePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invoicePreview} alt="Preview" className="w-full object-contain rounded-lg" />
                ) : (
                  <><ImageIcon size={22} /><span className="text-xs">{t("invoiceAdd")}</span></>
                )}
              </button>
              {invoicePreview && (
                <button type="button" onClick={() => { setInvoiceFile(null); setInvoicePreview(null); }}
                  className="text-xs text-red-500 hover:underline">{t("invoiceRemove")}</button>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tc('saving') : t('add')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
