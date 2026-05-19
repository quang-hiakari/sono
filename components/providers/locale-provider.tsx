'use client';

import { useState, useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import vi from '../../messages/vi.json';
import en from '../../messages/en.json';
import ja from '../../messages/ja.json';

const MESSAGES = { vi, en, ja };
type Locale = keyof typeof MESSAGES;

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'vi';
  const m = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  const v = m?.[1];
  return (['vi', 'en', 'ja'].includes(v ?? '') ? v : 'vi') as Locale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('vi');

  useEffect(() => {
    setLocale(readLocale());
    // Re-sync when cookie changes (language toggle sets cookie then calls router.refresh)
    const id = setInterval(() => setLocale(readLocale()), 300);
    return () => clearInterval(id);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
