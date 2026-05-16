import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: '📒',
    title: 'Ghi nợ dễ dàng',
    desc: 'Ghi khoản nợ với tiêu đề, số tiền, ngày tháng và ghi chú chi tiết.',
  },
  {
    icon: '📷',
    title: 'Biên lai ảnh',
    desc: 'Người nợ chụp và gửi biên lai ngay trên điện thoại kèm mỗi thanh toán.',
  },
  {
    icon: '✅',
    title: 'Duyệt thanh toán',
    desc: 'Chủ nợ xem và duyệt từng khoản — minh bạch, không tranh cãi.',
  },
];

export default async function HomePage() {
  try {
    const me = await getCurrentUser();
    if (me) redirect('/books');
  } catch {
    // Auth error — render landing page
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="SoNo" width={28} height={28} />
            <span className="font-bold text-blue-700 text-lg">SoNo</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex justify-center">
            <Image src="/logo.svg" alt="SoNo" width={80} height={80} className="drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">
              Sổ Nợ Gia Đình
            </h1>
            <p className="text-lg text-slate-500 mt-3">
              Ghi nợ, gửi biên lai, duyệt thanh toán —<br className="hidden sm:inline" />
              tất cả trong một ứng dụng.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 px-8 rounded-xl text-base">
            <Link href="/login">Bắt đầu ngay →</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-slate-700 text-center mb-10">
            Tính năng chính
          </h2>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3 max-w-md mx-auto">
            {[
              'Tạo nhiều sổ nợ với bất kỳ ai đã có tài khoản',
              'Người nợ gửi biên lai ảnh kèm mỗi thanh toán',
              'Chủ nợ duyệt hoặc từ chối từng khoản thanh toán',
              'Nhận email ngay khi có thanh toán mới chờ duyệt',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-slate-600">
                <span className="text-green-500 font-bold mt-0.5 shrink-0">✓</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 text-center bg-blue-700">
        <div className="max-w-lg mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-white">Sẵn sàng bắt đầu?</h2>
          <p className="text-blue-200 text-sm">Đăng nhập bằng email — không cần mật khẩu.</p>
          <Button asChild size="lg" variant="outline"
            className="h-12 px-8 rounded-xl text-base bg-white text-blue-700 hover:bg-blue-50 border-white">
            <Link href="/login">Đăng nhập ngay</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center">
        <p className="text-slate-400 text-sm">SoNo © 2026 — Ứng dụng theo dõi nợ gia đình</p>
      </footer>
    </div>
  );
}
