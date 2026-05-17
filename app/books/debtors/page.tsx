export const runtime = 'edge';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getMyBooks, getPartnerName, DebtBook } from '@/lib/queries/books';
import { ThemeToggle } from '@/components/shell/theme-toggle';

const AVATAR_COLORS = ['#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4'];

function avatarColor(name: string) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

interface Partner {
  id: string;
  name: string;
  email: string;
  books: DebtBook[];
  theyOweMe: boolean;
  iOweThem: boolean;
}

function buildPartners(books: DebtBook[], myId: string): Partner[] {
  const map = new Map<string, Partner>();
  for (const book of books) {
    const isCreditor = book.creditor_id === myId;
    const partnerId = isCreditor ? book.debtor_id : book.creditor_id;
    const partnerName = getPartnerName(book, myId);
    const partnerEmail = isCreditor ? book.debtor_email : book.creditor_email;
    if (!map.has(partnerId)) {
      map.set(partnerId, { id: partnerId, name: partnerName, email: partnerEmail, books: [], theyOweMe: false, iOweThem: false });
    }
    const p = map.get(partnerId)!;
    p.books.push(book);
    if (isCreditor) p.theyOweMe = true;
    else p.iOweThem = true;
  }
  return Array.from(map.values());
}

export default async function DebtorsPage() {
  const me = await getCurrentUser();
  const books = await getMyBooks(me!.id);
  const partners = buildPartners(books, me!.id);

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
            {partners.length > 0 && (
              <span className="text-xs text-slate-400 dark:text-white/35 font-medium">{partners.length} người</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28">
        {partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
              <Users size={28} className="text-slate-300 dark:text-white/25" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-slate-500 dark:text-white/60 text-sm">Chưa có người liên quan</p>
              <p className="text-xs text-slate-400 dark:text-white/30">Tạo sổ nợ để thêm người</p>
            </div>
            <Link
              href="/books/new"
              className="mt-2 flex items-center gap-2 bg-[#00c9a7] hover:bg-[#00b498] text-[#0d0d0f] font-bold text-sm px-6 py-3 rounded-full transition-colors"
            >
              Tạo sổ nợ
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            <h2 className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest px-1 mb-4">
              Người liên quan
            </h2>
            {partners.map(partner => {
              const initial = (partner.name?.[0] || partner.email?.[0] || '?').toUpperCase();
              const color = avatarColor(partner.name || partner.email);
              return (
                <div
                  key={partner.id}
                  className="flex items-center gap-3 bg-white dark:bg-[#18181f] rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-none"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {partner.name || partner.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 truncate">{partner.email}</p>
                    <p className="text-xs text-slate-400 dark:text-white/25 mt-0.5">
                      {partner.books.length} sổ nợ
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {partner.theyOweMe && (
                      <span className="text-[11px] bg-[#00c9a7]/15 text-[#00a88a] dark:text-[#00c9a7] px-2 py-0.5 rounded-full font-medium">
                        Nợ tôi
                      </span>
                    )}
                    {partner.iOweThem && (
                      <span className="text-[11px] bg-orange-500/15 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                        Tôi nợ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
