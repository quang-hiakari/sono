'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { UserProfile } from '@/lib/queries/profile';
import { Bank } from '@/lib/queries/banks';
import { BankSelect } from '@/components/ui/bank-select';

interface ProfileFormProps {
  profile: UserProfile | null;
  userId: string;
  initialBanks: Bank[];
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

const COUNTRIES = [
  { code: 'VN', labelKey: 'countryVN' as const },
  { code: 'JP', labelKey: 'countryJP' as const },
] as const;

export function ProfileForm({ profile, userId, initialBanks }: ProfileFormProps) {
  const t = useTranslations('profile');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrBust, setQrBust] = useState(0);
  const [country, setCountry] = useState(profile?.country ?? 'VN');
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [bankName, setBankName] = useState(profile?.bank_name ?? '');
  const [branchName, setBranchName] = useState(profile?.branch_name ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  const hasQr = !!profile?.bank_qr_url;
  const qrUrl = hasQr || qrBust > 0 ? `/api/qr/${userId}?t=${qrBust}` : null;

  async function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    setBankName('');
    setBranchName('');
    try {
      const res = await fetch(`/api/banks?country=${newCountry}`);
      const data = await res.json() as { banks: Bank[] };
      setBanks(data.banks);
    } catch {
      // keep existing bank list on error
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fd.get('full_name') || undefined,
        country,
        bank_name: bankName || undefined,
        branch_name: branchName || undefined,
        account_number: fd.get('account_number') || undefined,
        account_holder: fd.get('account_holder') || undefined,
      }),
    });
    setSaving(false);
    const result = await res.json().catch(() => ({})) as { error?: string };
    if (result.error) toast.error(result.error);
    else toast.success(t('saveSuccess'));
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
      toast.success(t('qrUploadSuccess'));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="space-y-4">
        <FormSection title={t('personalInfo')}>
          <FormField label={t('displayName')} htmlFor="full_name">
            <FormInput id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} placeholder={t('displayNamePlaceholder')} maxLength={80} />
          </FormField>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500 dark:text-white/45">{t('country')}</p>
            <div className="flex gap-2">
              {COUNTRIES.map(({ code, labelKey }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleCountryChange(code)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    country === code
                      ? 'bg-[#00c9a7] border-[#00c9a7] text-[#0d0d0f]'
                      : 'bg-slate-50 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-white/45 hover:border-slate-300 dark:hover:border-white/15'
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection title={t('bank')}>
          <FormField label={t('bankName')} htmlFor="bank_name">
            <BankSelect
              banks={banks}
              value={bankName}
              onChange={setBankName}
              placeholder={t('selectBank')}
            />
          </FormField>
          <FormField label={t('branchName')} htmlFor="branch_name">
            <input
              id="branch_name"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
              placeholder={t('branchNamePlaceholder')}
              maxLength={100}
              className="w-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[#00c9a7]/60 dark:focus:border-[#00c9a7]/50 focus:bg-white dark:focus:bg-white/[0.07] transition-colors"
            />
          </FormField>
          <FormField label={t('accountNumber')} htmlFor="account_number">
            <FormInput id="account_number" name="account_number" defaultValue={profile?.account_number ?? ''} placeholder={t('accountNumberPlaceholder')} inputMode="numeric" />
          </FormField>
          <FormField label={t('accountHolder')} htmlFor="account_holder">
            <FormInput id="account_holder" name="account_holder" defaultValue={profile?.account_holder ?? ''} placeholder={t('accountHolderPlaceholder')} className="uppercase" />
          </FormField>
        </FormSection>

        <button type="submit" disabled={saving}
          className="w-full bg-[#00c9a7] hover:bg-[#00b498] disabled:opacity-50 text-[#0d0d0f] font-bold py-3.5 rounded-2xl text-sm transition-colors">
          {saving ? t('saving') : t('save')}
        </button>
      </form>

      <FormSection title={t('qr')}>
        {qrUrl && (
          <div className="flex justify-center py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR chuyển khoản" className="w-full object-contain rounded-xl border border-slate-200 dark:border-white/[0.08]" />
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-400 dark:text-white/45 text-sm font-medium hover:text-slate-600 dark:hover:text-white/65 hover:border-slate-300 dark:hover:border-white/15 disabled:opacity-50 transition-colors">
          {uploading ? t('uploading') : qrUrl ? t('changeQr') : t('uploadQr')}
        </button>
        <p className="text-xs text-slate-400 dark:text-white/25 text-center">{t('qrHint')}</p>
      </FormSection>
    </div>
  );
}
