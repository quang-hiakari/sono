'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BankingProfile {
  bank_name: string | null;
  branch_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  creditor_id: string | null;
  has_qr: boolean;
}

export function BankingInfoPanel({ profile }: { profile: BankingProfile | null }) {
  const hasBankInfo = profile?.bank_name || profile?.account_number;
  const hasQr = profile?.has_qr && profile?.creditor_id;
  if (!hasBankInfo && !hasQr) return null;

  const showTabs = hasBankInfo && hasQr;
  const defaultTab = hasBankInfo ? 'bank' : 'qr';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <span className="flex items-center gap-2"><CreditCard size={15} />Thông tin chuyển khoản</span>
          <span className="text-xs text-blue-500">Xem →</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Thông tin chuyển khoản
        </DialogTitle>
        <TabContent profile={profile!} showTabs={!!showTabs} defaultTab={defaultTab} />
      </DialogContent>
    </Dialog>
  );
}

function TabContent({ profile, showTabs, defaultTab }: {
  profile: BankingProfile;
  showTabs: boolean;
  defaultTab: string;
}) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="space-y-4">
      {showTabs && (
        <div className="flex rounded-lg bg-slate-100 dark:bg-white/[0.06] p-1 gap-1">
          {['bank', 'qr'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === t
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'
              )}
            >
              {t === 'bank' ? 'Ngân hàng' : 'Mã QR'}
            </button>
          ))}
        </div>
      )}

      {tab === 'bank' && (
        <div className="space-y-4">
          {profile.bank_name && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Ngân hàng</p>
              <p className="font-medium text-slate-800 dark:text-white">{profile.bank_name}</p>
            </div>
          )}
          {profile.branch_name && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Chi nhánh</p>
              <p className="font-medium text-slate-800 dark:text-white">{profile.branch_name}</p>
            </div>
          )}
          {profile.account_number && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Số tài khoản</p>
              <p className="font-mono font-bold text-2xl tracking-widest text-slate-900 dark:text-white">
                {profile.account_number}
              </p>
            </div>
          )}
          {profile.account_holder && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Chủ tài khoản</p>
              <p className="font-medium uppercase text-slate-800 dark:text-white">{profile.account_holder}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'qr' && profile.creditor_id && (
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr/${profile.creditor_id}`}
            alt="QR chuyển khoản"
            className="w-full object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
