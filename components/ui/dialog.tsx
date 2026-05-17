'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dialog({ children, open, onOpenChange }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}

export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl bg-white dark:bg-[#18181f] shadow-xl p-5',
          className
        )}
      >
        {children}
        <RadixDialog.Close className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white/60">
          <X size={18} />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogTitle = RadixDialog.Title;
