'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { DebtBook } from '@/lib/queries/books';

function getPartnerName(book: DebtBook, myId: string) {
  return myId === book.creditor_id
    ? (book.debtor_name || book.debtor_email)
    : (book.creditor_name || book.creditor_email);
}

const AVATAR_COLORS = ['#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4'];

function avatarColor(name: string) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function BookCard({ book, myId }: { book: DebtBook; myId: string }) {
  const partner = getPartnerName(book, myId);
  const isDeleted = !!book.deleted_at;

  return (
    <Link href={`/books/${book.id}`}>
      <div className={`flex items-center gap-3 bg-white dark:bg-[#18181f] rounded-2xl px-4 py-3.5 border transition-all cursor-pointer shadow-sm dark:shadow-none ${
        isDeleted
          ? 'border-slate-100 dark:border-white/[0.03] opacity-50'
          : 'border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.12] active:scale-[0.99]'
      }`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ backgroundColor: isDeleted ? '#94a3b8' : avatarColor(partner) }}>
          {(partner[0] || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm truncate ${isDeleted ? 'line-through text-slate-400 dark:text-white/30' : 'text-slate-900 dark:text-white'}`}>
              {book.name}
            </p>
            {isDeleted && (
              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
                Đã xoá
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 truncate">{partner}</p>
        </div>
      </div>
    </Link>
  );
}

function EmptyTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
        <BookOpen size={24} className="text-slate-300 dark:text-white/25" />
      </div>
      <p className="text-slate-400 dark:text-white/30 text-sm">Chưa có sổ nợ nào</p>
    </div>
  );
}

interface Props {
  creditorBooks: DebtBook[];
  debtorBooks: DebtBook[];
  myId: string;
}

export function BooksTabs({ creditorBooks, debtorBooks, myId }: Props) {
  const t = useTranslations('books');
  const [tab, setTab] = useState<'creditor' | 'debtor'>(
    creditorBooks.length >= debtorBooks.length ? 'creditor' : 'debtor'
  );

  const tabs = [
    { id: 'creditor' as const, label: t('creditor'), count: creditorBooks.filter(b => !b.deleted_at).length },
    { id: 'debtor' as const, label: t('debtor'), count: debtorBooks.filter(b => !b.deleted_at).length },
  ];

  const books = tab === 'creditor' ? creditorBooks : debtorBooks;

  return (
    <>
      {/* Tab bar */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-white/[0.05] p-1 gap-1 mb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'
            )}>
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                tab === t.id
                  ? 'bg-[#00c9a7]/20 text-[#00a88a] dark:text-[#00c9a7]'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/30'
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* New book button — creditor tab only */}
      {tab === 'creditor' && (
        <Link href="/books/new"
          className="flex items-center justify-center gap-1.5 w-full bg-[#00c9a7] hover:bg-[#00b498] text-[#0d0d0f] font-bold text-sm py-3 rounded-xl transition-colors mb-3">
          <Plus size={15} /> {t('newFull')}
        </Link>
      )}

      {/* List */}
      {books.length === 0 ? (
        <EmptyTab />
      ) : (
        <div className="flex flex-col gap-3">
          {books.map(b => <BookCard key={b.id} book={b} myId={myId} />)}
        </div>
      )}
    </>
  );
}
