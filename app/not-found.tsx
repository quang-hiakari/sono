import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Không tìm thấy trang</h2>
        <Link href="/" className="text-blue-600 hover:underline">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
