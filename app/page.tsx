import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';

function BookOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const features = [
  { icon: <BookOpenIcon />, text: 'Ghi nợ với tiêu đề, số tiền, ngày tháng và ghi chú chi tiết' },
  { icon: <CameraIcon />, text: 'Người nợ gửi biên lai ảnh kèm mỗi thanh toán' },
  { icon: <CheckCircleIcon />, text: 'Chủ nợ xem và duyệt từng khoản — minh bạch, không tranh cãi' },
  { icon: <BellIcon />, text: 'Nhận email ngay khi có thanh toán mới chờ duyệt' },
  { icon: <UsersIcon />, text: 'Tạo sổ nợ với bất kỳ ai — chưa có tài khoản vẫn được' },
];

const mockEntries = [
  { initials: 'BA', bg: '#3b82f6' },
  { initials: 'MẸ', bg: '#f43f5e' },
  { initials: 'AN', bg: '#f59e0b' },
];

export default async function HomePage() {
  // .catch(() => null) prevents D1-unavailable errors (local dev) from crashing the page
  // and keeps redirect() outside catch so Next.js can handle it correctly
  const me = await getCurrentUser().catch(() => null);
  if (me) redirect('/books');

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline">
          <span className="font-black text-2xl tracking-tight">SỔ</span>
          <span className="text-[#00c9a7] font-black text-2xl tracking-tight">NỢ</span>
        </div>
        <div className="flex items-center gap-4 text-white/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hover:text-white/80 cursor-pointer transition-colors">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hover:text-white/80 cursor-pointer transition-colors">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 px-8 lg:px-16 py-10 max-w-6xl mx-auto w-full">
        {/* Phone Mockup */}
        <div className="flex justify-center order-2 lg:order-1">
          <div className="relative w-[260px] h-[520px] bg-[#18181f] rounded-[44px] border-2 border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0d0d0f] rounded-b-2xl z-10" />
            {/* App header */}
            <div className="px-5 pt-10 pb-3 flex items-center justify-between">
              <div className="flex items-baseline">
                <span className="font-black text-sm">SỔ</span>
                <span className="text-[#00c9a7] font-black text-sm">NỢ</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/15" />
                <div className="w-2 h-2 rounded-full bg-white/15" />
              </div>
            </div>
            {/* Entries */}
            <div className="flex-1 px-4 space-y-2.5 mt-2">
              {mockEntries.map((e) => (
                <div key={e.initials} className="flex items-center gap-3 bg-white/[0.04] rounded-2xl px-3 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] text-white shrink-0" style={{ backgroundColor: e.bg }}>
                    {e.initials}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="w-20 h-2.5 bg-white/25 rounded-full" />
                    <div className="w-12 h-2 bg-[#00c9a7]/35 rounded-full" />
                  </div>
                  <div className="w-14 h-2.5 bg-white/15 rounded-full shrink-0" />
                </div>
              ))}
            </div>
            {/* Bottom nav */}
            <div className="flex justify-around items-center px-8 py-4 border-t border-white/[0.06]">
              <div className="w-5 h-5 rounded bg-[#00c9a7]" />
              <div className="w-5 h-5 rounded bg-white/15" />
              <div className="w-5 h-5 rounded bg-white/15" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Brand */}
          <div>
            <div className="flex items-start gap-5">
              <h1 className="font-black text-[68px] sm:text-[80px] leading-none tracking-tight">SỔ</h1>
              <div className="border-l-2 border-white/15 pl-5 pt-4">
                <p className="italic text-white/45 text-sm sm:text-base">/sổ nợ/ — debt ledger 📒</p>
              </div>
            </div>
            <h2 className="text-[#00c9a7] font-black text-[68px] sm:text-[80px] leading-none tracking-tight -mt-2">NỢ</h2>
          </div>
          <p className="text-white/55 text-lg">Theo dõi nợ gia đình, đơn giản.</p>

          {/* Features */}
          <ul className="space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#00c9a7] shrink-0 mt-0.5">{f.icon}</span>
                <span className="text-white/70 text-sm leading-relaxed">{f.text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-[#00c9a7] hover:bg-[#00b498] active:bg-[#00a085] text-[#0d0d0f] font-bold text-lg px-12 py-4 rounded-full transition-colors duration-200"
          >
            Mở Ứng Dụng
          </Link>
        </div>
      </main>
    </div>
  );
}
