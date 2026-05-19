export const runtime = 'edge';
import Link from 'next/link';
import { Bell, CheckCircle, Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getProfile } from '@/lib/queries/profile';
import { getPendingApprovals, getRecentDebts } from '@/lib/queries/notifications';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { getT } from '@/lib/i18n';
import { LanguageToggle } from '@/components/shell/language-toggle';

export default async function HomePage() {
  const me = await getCurrentUser();
  const [pendingApprovals, recentDebts, profile] = await Promise.all([
    getPendingApprovals(me!.id),
    getRecentDebts(me!.id),
    getProfile(me!.id),
  ]);
  const displayName = profile?.full_name || me!.name || me!.email;
  const t = await getT('home');

  const hasNotifications = pendingApprovals.length > 0 || recentDebts.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="font-black text-xl tracking-tight">SỔ</span>
            <span className="text-[#00c9a7] font-black text-xl tracking-tight">NỢ</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle /><ThemeToggle />
            <div className="relative p-1.5">
              <Bell size={18} className="text-slate-400 dark:text-white/40" strokeWidth={1.5} />
              {hasNotifications && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#00c9a7] rounded-full" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-8">
        {/* Greeting */}
        <div>
          <p className="text-slate-500 dark:text-white/40 text-sm">{t('greeting')}</p>
          <p className="text-slate-900 dark:text-white font-bold text-xl">{displayName}</p>
        </div>

        {!hasNotifications && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
              <CheckCircle size={28} className="text-slate-300 dark:text-white/20" />
            </div>
            <p className="text-slate-400 dark:text-white/40 text-sm">{t('noNotifications')}</p>
          </div>
        )}

        {/* Pending Approvals Section */}
        {pendingApprovals.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest">
                {t('needApprove')}
              </h2>
              <span className="text-[11px] bg-[#00c9a7]/15 text-[#00a88a] dark:text-[#00c9a7] px-2 py-0.5 rounded-full font-semibold">
                {pendingApprovals.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {pendingApprovals.map(n => (
                <Link key={n.book_id} href={`/books/${n.book_id}/payments`}>
                  <div className="flex items-start gap-3 bg-white dark:bg-[#18181f] rounded-2xl px-4 py-3.5 border border-[#00c9a7]/20 dark:border-[#00c9a7]/10 hover:border-[#00c9a7]/40 dark:hover:border-[#00c9a7]/25 transition-colors shadow-sm dark:shadow-none">
                    <div className="w-9 h-9 rounded-xl bg-[#00c9a7]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={16} className="text-[#00c9a7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{n.book_name}</p>
                      <p className="text-xs text-slate-500 dark:text-white/45 mt-0.5">
                        {t('paymentsWaiting', { name: n.debtor_name || n.debtor_email, count: String(n.payment_count) })}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-full font-semibold">
                      {n.payment_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Debts Section */}
        {recentDebts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-widest">
              {t('recentDebts')}
            </h2>
            <div className="flex flex-col gap-3">
              {recentDebts.map(d => (
                <Link key={d.debt_id} href={`/books/${d.book_id}`}>
                  <div className="flex items-center gap-3 bg-white dark:bg-[#18181f] rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors shadow-sm dark:shadow-none">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                      <Plus size={16} className="text-slate-400 dark:text-white/35" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{d.title}</p>
                      <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 truncate">
                        {d.book_name} · {formatDate(d.debt_date)}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-sm text-red-500 dark:text-red-400">
                      {formatAmount(d.amount, d.currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
