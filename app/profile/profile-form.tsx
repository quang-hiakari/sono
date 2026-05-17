'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { UserProfile } from '@/lib/queries/profile';

interface ProfileFormProps {
  profile: UserProfile | null;
  userId: string;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-white/[0.05] overflow-hidden shadow-sm dark:shadow-none">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.05]">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-4 py-4 space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-500 dark:text-white/45">{label}</label>
      {children}
    </div>
  );
}

function FormInput({ id, name, defaultValue, placeholder, maxLength, inputMode, className }: {
  id: string; name: string; defaultValue?: string; placeholder?: string;
  maxLength?: number; inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  className?: string;
}) {
  return (
    <input id={id} name={name} defaultValue={defaultValue ?? ''} placeholder={placeholder}
      maxLength={maxLength} inputMode={inputMode}
      className={`w-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[#00c9a7]/60 dark:focus:border-[#00c9a7]/50 focus:bg-white dark:focus:bg-white/[0.07] transition-colors ${className ?? ''}`}
    />
  );
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrBust, setQrBust] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasQr = !!profile?.bank_qr_url;
  const qrUrl = hasQr || qrBust > 0 ? `/api/qr/${userId}?t=${qrBust}` : null;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fd.get('full_name') || undefined,
        bank_name: fd.get('bank_name') || undefined,
        account_number: fd.get('account_number') || undefined,
        account_holder: fd.get('account_holder') || undefined,
      }),
    });
    setSaving(false);
    const result = await res.json().catch(() => ({})) as { error?: string };
    if (result.error) toast.error(result.error);
    else toast.success('Đã lưu thông tin.');
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await fetch('/api/profile/qr', {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: file,
    });
    setUploading(false);
    const result = await res.json().catch(() => ({})) as { error?: string };
    if (result.error) toast.error(result.error);
    else {
      setQrBust(Date.now());
      toast.success('Đã tải ảnh QR.');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="space-y-4">
        <FormSection title="Thông tin cá nhân">
          <FormField label="Tên hiển thị" htmlFor="full_name">
            <FormInput id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} placeholder="Tên của bạn" maxLength={80} />
          </FormField>
        </FormSection>

        <FormSection title="Thông tin ngân hàng">
          <FormField label="Tên ngân hàng" htmlFor="bank_name">
            <FormInput id="bank_name" name="bank_name" defaultValue={profile?.bank_name ?? ''} placeholder="Vietcombank, MB Bank..." />
          </FormField>
          <FormField label="Số tài khoản" htmlFor="account_number">
            <FormInput id="account_number" name="account_number" defaultValue={profile?.account_number ?? ''} placeholder="0123456789" inputMode="numeric" />
          </FormField>
          <FormField label="Tên chủ tài khoản" htmlFor="account_holder">
            <FormInput id="account_holder" name="account_holder" defaultValue={profile?.account_holder ?? ''} placeholder="NGUYEN VAN A" className="uppercase" />
          </FormField>
        </FormSection>

        <button type="submit" disabled={saving}
          className="w-full bg-[#00c9a7] hover:bg-[#00b498] disabled:opacity-50 text-[#0d0d0f] font-bold py-3.5 rounded-2xl text-sm transition-colors">
          {saving ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </form>

      <FormSection title="Mã QR chuyển khoản">
        {qrUrl && (
          <div className="flex justify-center py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR chuyển khoản" className="w-full object-contain rounded-xl border border-slate-200 dark:border-white/[0.08]" />
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-400 dark:text-white/45 text-sm font-medium hover:text-slate-600 dark:hover:text-white/65 hover:border-slate-300 dark:hover:border-white/15 disabled:opacity-50 transition-colors">
          {uploading ? 'Đang tải...' : qrUrl ? 'Đổi ảnh QR' : 'Tải ảnh QR lên'}
        </button>
        <p className="text-xs text-slate-400 dark:text-white/25 text-center">Ảnh QR từ app ngân hàng của bạn (tối đa 3MB)</p>
      </FormSection>
    </div>
  );
}
