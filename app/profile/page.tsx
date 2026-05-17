import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getProfile } from '@/lib/queries/profile';
import { getPresignedUrl } from '@/lib/r2-presign';
import { ProfileForm } from './profile-form';
import { ThemeToggle } from '@/components/shell/theme-toggle';

export const runtime = 'edge';

export default async function ProfilePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');

  const profile = await getProfile(me.id);
  let qrSignedUrl: string | null = null;
  if (profile?.bank_qr_url) {
    qrSignedUrl = await getPresignedUrl(profile.bank_qr_url, 3600).catch(() => null);
  }

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
          <ThemeToggle />
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

        <ProfileForm profile={profile} qrSignedUrl={qrSignedUrl} />

        <form action="/logout" method="POST">
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] text-slate-400 dark:text-white/40 text-sm font-medium hover:text-slate-600 dark:hover:text-white/60 hover:border-slate-300 dark:hover:border-white/15 transition-colors"
          >
            Đăng xuất
          </button>
        </form>
      </main>
    </div>
  );
}
