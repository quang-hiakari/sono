'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Đã có lỗi xảy ra</h2>
        <p className="text-slate-500">Vui lòng thử lại.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
