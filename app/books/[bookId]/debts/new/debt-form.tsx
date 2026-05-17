'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyAmountInput } from '@/components/ui/currency-amount-input';
import { PageContainer } from '@/components/shell/page-container';
import { createDebt } from '../actions';

interface Props {
  bookId: string;
  currency: string;
}

export function DebtForm({ bookId, currency }: Props) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createDebt(bookId, new FormData(e.currentTarget));
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success('Đã thêm khoản nợ.');
      (e.target as HTMLFormElement).reset();
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href={`/books/${bookId}/debts`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={15} /> Quay lại
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thêm khoản nợ mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Tên khoản nợ *</Label>
              <Input id="title" name="title" required maxLength={120} placeholder="Ví dụ: Tiền điện tháng 5" autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Số tiền ({currency}) *</Label>
              <CurrencyAmountInput
                currency={currency}
                name="amount"
                required
                placeholder="500,000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt_date">Ngày</Label>
              <Input id="debt_date" name="debt_date" type="date" defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea id="notes" name="notes" maxLength={500} placeholder="Ghi chú thêm (không bắt buộc)" rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Thêm khoản nợ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
