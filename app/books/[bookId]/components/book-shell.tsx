'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, CreditCard, PlusCircle, History, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DebtBook } from '@/lib/queries/books';

interface BookShellProps {
  children: React.ReactNode;
  book: DebtBook;
  myId: string;
  isCreditor: boolean;
}

export function BookShell({ children, book, isCreditor }: BookShellProps) {
  const pathname = usePathname();
  const bookId = book.id;
  const partnerName = isCreditor
    ? (book.debtor_name || book.debtor_email)
    : (book.creditor_name || book.creditor_email);

  const creditorLinks = [
    { href: `/books/${bookId}`, label: 'Tổng quan', icon: Home },
    { href: `/books/${bookId}/debts`, label: 'Khoản nợ', icon: List },
    { href: `/books/${bookId}/payments`, label: 'Thanh toán', icon: CreditCard },
  ];
  const debtorLinks = [
    { href: `/books/${bookId}`, label: 'Tổng quan', icon: Home },
    { href: `/books/${bookId}/payments/new`, label: 'Trả nợ', icon: PlusCircle },
    { href: `/books/${bookId}/payments`, label: 'Lịch sử', icon: History },
  ];
  const links = isCreditor ? creditorLinks : debtorLinks;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/books" className="shrink-0 text-slate-400 hover:text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 truncate text-sm">{book.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {isCreditor ? 'Người nợ' : 'Người cho nợ'}: {partnerName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1">
              Hồ sơ
            </Link>
            <form action="/logout" method="POST">
              <button type="submit" className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      {children}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex max-w-3xl mx-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors',
                  active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
