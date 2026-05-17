'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  {
    href: '/books/home',
    label: 'Trang chủ',
    icon: Home,
    isActive: (p: string) => p === '/books/home',
  },
  {
    href: '/books',
    label: 'Sổ nợ',
    icon: BookOpen,
    isActive: (p: string) =>
      p === '/books' ||
      (p.startsWith('/books/') && !p.startsWith('/books/home') && !p.startsWith('/books/debtors')),
  },
  {
    href: '/books/debtors',
    label: 'Liên quan',
    icon: Users,
    isActive: (p: string) => p === '/books/debtors' || p.startsWith('/books/debtors/'),
  },
  {
    href: '/profile',
    label: 'Hồ sơ',
    icon: User,
    isActive: (p: string) => p.startsWith('/profile'),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  // BookShell has its own nav for book-specific pages — hide global nav there
  const isInsideBook = /^\/books\/(?!home$|home\/|debtors$|debtors\/|new$|new\/)[^/]+/.test(pathname);
  if (isInsideBook) return null;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#18181f]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.07]">
      <div className="max-w-3xl mx-auto flex">
        {TABS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 transition-colors duration-150',
                active
                  ? 'text-[#00c9a7]'
                  : 'text-slate-400 hover:text-slate-600 dark:text-white/35 dark:hover:text-white/60',
              )}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
