'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendOtp, verifyOtp } from './actions';

type Step = 'email' | 'code';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await sendOtp(email);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setStep('code');
      toast.success('Mã xác nhận đã được gửi!');
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await verifyOtp(email, otp.trim());
    // On success, server redirects — this only runs on error
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    const result = await sendOtp(email);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else toast.success('Đã gửi lại mã mới!');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.svg" alt="SoNo" width={48} height={48} />
          </div>
          <h1 className="text-2xl font-bold text-blue-700">SoNo</h1>
          <p className="text-slate-500 text-sm mt-1">Sổ Nợ Gia Đình</p>
        </div>

        {step === 'email' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Đăng nhập</CardTitle>
              <p className="text-sm text-slate-500">Nhập email để nhận mã xác nhận.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nhập mã xác nhận</CardTitle>
              <p className="text-sm text-slate-500">
                Mã 6 chữ số đã gửi đến<br />
                <span className="font-medium text-slate-700">{email}</span>
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">Mã xác nhận</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 text-center">Mã có hiệu lực trong 10 phút</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                  {loading ? 'Đang xác nhận...' : 'Đăng nhập'}
                </Button>
              </form>
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStep('email'); setOtp(''); }}
                  className="text-slate-400 hover:text-slate-700"
                  disabled={loading}
                >
                  ← Đổi email
                </button>
                <button
                  onClick={handleResend}
                  className="text-blue-600 hover:underline"
                  disabled={loading}
                >
                  Gửi lại mã
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
