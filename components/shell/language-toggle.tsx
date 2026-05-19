'use client';

import { useRouter } from 'next/navigation';

const LOCALES = [
  { code: 'vi', label: '🇻🇳 Tiếng Việt' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ja', label: '🇯🇵 日本語' },
] as const;

type Locale = typeof LOCALES[number]['code'];

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'vi';
  const m = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  return (LOCALES.find(l => l.code === m?.[1])?.code ?? 'vi') as Locale;
}

export function LanguageToggle() {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  const current = readLocale();

  return (
    <select
      value={current}
      onChange={handleChange}
      className="text-xs bg-transparent text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 border-none outline-none cursor-pointer px-1 py-1"
      aria-label="Language"
    >
      {LOCALES.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
