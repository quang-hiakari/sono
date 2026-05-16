import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getMyBooks, getPartnerName, DebtBook } from '@/lib/queries/books';
import { PageContainer } from '@/components/shell/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function BookCard({ book, myId }: { book: DebtBook; myId: string }) {
  const isCreditor = book.creditor_id === myId;
  const partnerName = getPartnerName(book, myId);

  return (
    <Link href={`/books/${book.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{book.name}</p>
              <p className="text-sm text-slate-500 mt-0.5 truncate">{partnerName}</p>
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              isCreditor
                ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {isCreditor ? 'Tôi cho nợ' : 'Tôi đang nợ'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function BooksPage() {
  const me = await getCurrentUser();
  const books = await getMyBooks(me!.id);

  const creditorBooks = books.filter(b => b.creditor_id === me!.id);
  const debtorBooks = books.filter(b => b.debtor_id === me!.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            <span className="font-bold text-blue-700">SoNo</span>
            <span className="text-xs text-slate-400">— {me!.name || me!.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/books/new"><Plus size={15} /> Tạo sổ</Link>
            </Button>
            <form action="/logout" method="POST">
              <button type="submit" className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <PageContainer>
        {books.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <BookOpen size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500">Bạn chưa có sổ nợ nào.</p>
            <Button asChild>
              <Link href="/books/new"><Plus size={16} /> Tạo sổ nợ đầu tiên</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {creditorBooks.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tôi cho nợ</h2>
                <div className="space-y-2">
                  {creditorBooks.map(b => <BookCard key={b.id} book={b} myId={me!.id} />)}
                </div>
              </section>
            )}
            {debtorBooks.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tôi đang nợ</h2>
                <div className="space-y-2">
                  {debtorBooks.map(b => <BookCard key={b.id} book={b} myId={me!.id} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
