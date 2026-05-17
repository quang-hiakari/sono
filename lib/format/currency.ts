export const CURRENCIES = [
  { code: 'VND', label: 'VNĐ — Việt Nam Đồng' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
] as const;

const LOCALE_MAP: Record<string, string> = {
  VND: 'vi-VN',
  USD: 'en-US',
  EUR: 'de-DE',
  JPY: 'ja-JP',
  SGD: 'en-SG',
};

const NO_DECIMALS = new Set(['VND', 'JPY']);

export function formatAmount(amount: number, currency = 'VND'): string {
  return new Intl.NumberFormat(LOCALE_MAP[currency] ?? 'vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: NO_DECIMALS.has(currency) ? 0 : 2,
  }).format(amount);
}

// Legacy alias kept for any remaining callers
export const formatVND = (amount: number) => formatAmount(amount, 'VND');
