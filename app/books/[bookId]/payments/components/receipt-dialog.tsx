'use client';

import { Image } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';

export function ReceiptDialog({ receiptPath, label }: { receiptPath: string; label?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <Image size={12} /> {label ?? 'Biên lai'}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Ảnh biên lai</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/receipt/${receiptPath}`}
          alt="Biên lai thanh toán"
          className="w-full object-contain rounded-xl"
        />
      </DialogContent>
    </Dialog>
  );
}
