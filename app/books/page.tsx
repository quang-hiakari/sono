export const runtime = 'edge';
import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getMyBooks } from '@/lib/queries/books';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { BooksTabs } from './components/books-tabs';

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
          <ThemeToggle />
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
            <Link href="/books/new"
              className="mt-2 flex items-center gap-2 bg-[#00c9a7] hover:bg-[#00b498] text-[#0d0d0f] font-bold text-sm px-6 py-3 rounded-full transition-colors">
              <Plus size={16} /> Tạo sổ nợ đầu tiên
            </Link>
          </div>
        ) : (
          <BooksTabs creditorBooks={creditorBooks} debtorBooks={debtorBooks} myId={me!.id} />
        )}
      </main>
    </div>
  );
}
