'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Bank } from '@/lib/queries/banks';

interface BankSelectProps {
  banks: Bank[];
  value?: string;
  onChange: (shortName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

export function BankSelect({ banks, value, onChange, placeholder, disabled, name }: BankSelectProps) {
  const t = useTranslations('profile');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? banks.filter(b =>
        b.short_name.toLowerCase().includes(query.toLowerCase()) ||
        b.name.toLowerCase().includes(query.toLowerCase())
      )
    : banks;

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <>
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="w-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#00c9a7]/60 dark:focus:border-[#00c9a7]/50 transition-colors disabled:opacity-50"
      >
        <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-white/20'}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className="shrink-0 text-slate-400 dark:text-white/30" />
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-[#0d0d0f]">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-white/[0.05]">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('bankSearch')}
                className="w-full bg-white dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[#00c9a7]/60 dark:focus:border-[#00c9a7]/50 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Bank list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-400 dark:text-white/30 py-12">{t('bankNotFound')}</p>
            ) : (
              filtered.map(bank => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    onChange(bank.short_name);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors ${
                    value === bank.short_name ? 'bg-[#00c9a7]/10 dark:bg-[#00c9a7]/10' : ''
                  }`}
                >
                  <p className={`text-sm font-semibold ${value === bank.short_name ? 'text-[#00c9a7]' : 'text-slate-900 dark:text-white'}`}>
                    {bank.short_name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5 truncate">{bank.name}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
