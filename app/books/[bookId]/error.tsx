'use client';

export default function BookError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="text-center space-y-3">
        <p className="text-slate-600">Đã có lỗi, thử lại nhé.</p>
        <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          Thử lại
        </button>
      </div>
    </div>
  );
}
