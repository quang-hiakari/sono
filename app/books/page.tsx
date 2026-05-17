export const runtime = 'edge';
import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getMyBooks, getPartnerName, DebtBook } from '@/lib/queries/books';
import { ThemeToggle } from '@/components/shell/theme-toggle';

const AVATAR_COLORS = ['#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4'];

function avatarColor(name: string) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function BookCard({ book, myId }: { book: DebtBook; myId: string }) {
  const isCreditor = book.creditor_id === myId;
  const partner = getPartnerName(book, myId);
  return (
    <Link href={`/books/${book.id}`}>
      <div className="flex items-center gap-3 bg-white dark:bg-[#18181f] rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.12] active:scale-[0.99] transition-all cursor-pointer shadow-sm dark:shadow-none">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ backgroundColor: avatarColor(partner) }}
        >
          {(partner[0] || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{book.name}</p>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 truncate">{partner}</p>
        </div>
        <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium ${
          isCreditor
            ? 'bg-[#00c9a7]/15 text-[#00a88a] dark:text-[#00c9a7]'
            : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
        }`}>
          {isCreditor ? 'Cho nợ' : 'Đang nợ'}
        </span>
      </div>
    </Link>
  );
}

export default async function BooksPage() {
  const me = await getCurrentUser();
  const books = await getMyBooks(me!.id);
  const creditorBooks = books.filter(b => b.creditor_id === me!.id);
  const debtorBooks = books.filter(b => b.debtor_id === me!.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="font-black text-xl tracking-tight">SỔ</span>
            <span className="text-[#00c9a7] font-black text-xl tracking-tight">NỢ</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/books/new"
              className="flex items-center gap-1.5 bg-[#00c9a7] hover:bg-[#00b498] text-[#0d0d0f] font-bold text-sm px-4 py-2 rounded-full transition-colors"
            >
              <Plus size={15} /> Tạo sổ
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
              <BookOpen size={28} className="text-slate-300 dark:text-white/25" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-slate-500 dark:text-white/60 text-sm">Chưa có sổ nợ nào</p>
              <p className="text-xs text-slate-400 dark:text-white/30">Tạo sổ nợ để bắt đầu theo dõi</p>
            </div>
            <Link
              href="/books/new"
              className="mt-2 flex items-center gap-2 bg-[#00c9a7] hover:bg-[#00b498] text-[#0d0d0f] font-bold text-sm px-6 py-3 rounded-full transition-colors"
            >
              <Plus size={16} /> Tạo sổ nợ đầu tiên
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {creditorBooks.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest px-1">
                  Tôi cho nợ
                </h2>
                <div className="space-y-2">
                  {creditorBooks.map(b => <BookCard key={b.id} book={b} myId={me!.id} />)}
                </div>
              </section>
            )}
            {debtorBooks.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest px-1">
                  Tôi đang nợ
                </h2>
                <div className="space-y-2">
                  {debtorBooks.map(b => <BookCard key={b.id} book={b} myId={me!.id} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
