import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getProfile } from '@/lib/queries/profile';
import { getBanksByCountry } from '@/lib/queries/banks';
import { ProfileForm } from './profile-form';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { LanguageToggle } from '@/components/shell/language-toggle';

export const runtime = 'edge';

export default async function ProfilePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');

  const profile = await getProfile(me.id);
  const country = profile?.country ?? 'VN';
  const initialBanks = await getBanksByCountry(country);

  const displayName = profile?.full_name || me.name || '';
  const initial = (displayName[0] || me.email?.[0] || '?').toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="font-black text-xl tracking-tight">SỔ</span>
            <span className="text-[#00c9a7] font-black text-xl tracking-tight">NỢ</span>
          </div>
          <div className="flex items-center gap-1"><LanguageToggle /><ThemeToggle /></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-6">
        <div className="flex items-center gap-4 py-2">
          <div className="w-14 h-14 rounded-2xl bg-[#00c9a7]/20 flex items-center justify-center font-black text-2xl text-[#00c9a7]">
            {initial}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-base">{displayName || 'Người dùng'}</p>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{me.email}</p>
          </div>
        </div>

        <ProfileForm profile={profile} userId={me.id} initialBanks={initialBanks} />

        <form action="/logout" method="POST">
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Đăng xuất
          </button>
        </form>
      </main>
    </div>
  );
}
