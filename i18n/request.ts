import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import vi from '../messages/vi.json';
import en from '../messages/en.json';
import ja from '../messages/ja.json';

const MESSAGES = { vi, en, ja } as const;
type Locale = keyof typeof MESSAGES;
const LOCALES: Locale[] = ['vi', 'en', 'ja'];

export default getRequestConfig(async () => {
  const raw = (await cookies()).get('NEXT_LOCALE')?.value ?? 'vi';
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : 'vi';
  return { locale, messages: MESSAGES[locale] };
});
