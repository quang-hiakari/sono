'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/shell/page-container';
import { createBook } from './actions';

export default function NewBookPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createBook(new FormData(e.currentTarget));
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
    // On success, server action redirects — no need to setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/books" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-semibold text-slate-800">Tạo sổ nợ mới</span>
        </div>
      </header>
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin sổ nợ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên sổ nợ *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  placeholder="Ví dụ: Nợ chung nhà 2025"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="debtorEmail">Email người nợ *</Label>
                <Input
                  id="debtorEmail"
                  name="debtorEmail"
                  type="email"
                  required
                  placeholder="nguoi-no@email.com"
                  autoComplete="email"
                />
                <p className="text-xs text-slate-400">Người này phải đã có tài khoản trong SoNo.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo sổ nợ'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
