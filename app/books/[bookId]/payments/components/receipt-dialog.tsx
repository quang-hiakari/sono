'use client';

import { useState, useEffect } from 'react';
import { Image, X } from 'lucide-react';

export function ReceiptDialog({ receiptPath, label }: { receiptPath: string; label?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
      >
        <Image size={12} /> {label ?? 'Biên lai'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <p className="text-sm font-semibold text-white/80">Ảnh biên lai</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image — scrollable + pinch-zoomable */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/receipt/${receiptPath}`}
              alt="Biên lai thanh toán"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ touchAction: 'pinch-zoom' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
