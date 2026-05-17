'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface BankingProfile {
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  qr_signed_url: string | null;
}

export function BankingInfoPanel({ profile }: { profile: BankingProfile | null }) {
  const [open, setOpen] = useState(false);

  const hasBankingInfo = profile?.bank_name || profile?.account_number || profile?.qr_signed_url;
  if (!hasBankingInfo) return null;

  return (
    <div className="border border-blue-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-sm font-medium text-blue-700"
      >
        <span>Thông tin chuyển khoản</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          {profile?.bank_name && (
            <div>
              <p className="text-xs text-slate-400">Ngân hàng</p>
              <p className="font-medium text-slate-800">{profile.bank_name}</p>
            </div>
          )}
          {profile?.account_number && (
            <div>
              <p className="text-xs text-slate-400">Số tài khoản</p>
              <p className="font-mono font-semibold text-xl tracking-wider text-slate-900">
                {profile.account_number}
              </p>
            </div>
          )}
          {profile?.account_holder && (
            <div>
              <p className="text-xs text-slate-400">Chủ tài khoản</p>
              <p className="font-medium uppercase text-slate-800">{profile.account_holder}</p>
            </div>
          )}
          {profile?.qr_signed_url && (
            <div className="flex flex-col items-center pt-2 space-y-2">
              <p className="text-xs text-slate-400">Mã QR chuyển khoản</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.qr_signed_url}
                alt="QR chuyển khoản"
                className="w-52 h-52 object-contain border border-gray-100 rounded-xl"
              />
              <a
                href={profile.qr_signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 inline-flex items-center gap-1 hover:underline"
              >
                Mở ảnh gốc <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
