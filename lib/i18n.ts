import { cookies } from 'next/headers';
import vi from '../messages/vi.json';
import en from '../messages/en.json';
import ja from '../messages/ja.json';

const MESSAGES = { vi, en, ja } as const;
type Locale = keyof typeof MESSAGES;
const VALID: Locale[] = ['vi', 'en', 'ja'];

/** Server-side translation helper. Usage: const t = await getT('home'); t('greeting') */
export async function getT(namespace: string) {
  const raw = (await cookies()).get('NEXT_LOCALE')?.value ?? 'vi';
  const locale: Locale = VALID.includes(raw as Locale) ? (raw as Locale) : 'vi';
  const ns = ((MESSAGES[locale] as unknown) as Record<string, Record<string, string>>)[namespace] ?? {};
  return (key: string, params?: Record<string, string | number>): string => {
    let val = ns[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => { val = val.replace(`{${k}}`, String(v)); });
    }
    return val;
  };
}
