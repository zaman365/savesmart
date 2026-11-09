import { parseSqlite } from './dates.ts';

export type Lang = 'bn' | 'en';
export const LANGS: Lang[] = ['bn', 'en'];

export function isLang(value: string): value is Lang {
  return value === 'bn' || value === 'en';
}

const intFormat: Record<Lang, Intl.NumberFormat> = {
  bn: new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }),
};
const decFormat: Record<Lang, Intl.NumberFormat> = {
  bn: new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }),
};
const relFormat: Record<Lang, Intl.RelativeTimeFormat> = {
  bn: new Intl.RelativeTimeFormat('bn', { numeric: 'auto' }),
  en: new Intl.RelativeTimeFormat('en', { numeric: 'auto' }),
};
const dateFormat: Record<Lang, Intl.DateTimeFormat> = {
  bn: new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' }),
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' }),
};

/** Taka with lakh grouping: ৳১,২৪,৯৯৯ in Bangla, ৳1,24,999 in English. */
export function money(amount: number, lang: Lang): string {
  return `৳${intFormat[lang].format(Math.round(amount))}`;
}

export function num(value: number, lang: Lang): string {
  return intFormat[lang].format(value);
}

export function dec(value: number, lang: Lang): string {
  return decFormat[lang].format(value);
}

export function gb(mb: number, lang: Lang): string {
  const value = mb / 1024;
  return `${value < 1 ? dec(value, lang) : num(Math.round(value * 10) / 10, lang)} GB`;
}

/** "3 hours ago" from a SQLite UTC timestamp. */
export function ago(ts: string, lang: Lang, nowMs: number = Date.now()): string {
  const seconds = Math.round((parseSqlite(ts) - nowMs) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relFormat[lang].format(0, 'minute');
  if (abs < 3600) return relFormat[lang].format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relFormat[lang].format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 45) return relFormat[lang].format(Math.round(seconds / 86400), 'day');
  return relFormat[lang].format(Math.round(seconds / (86400 * 30)), 'month');
}

/** "12 Nov" from a 'YYYY-MM-DD' calendar date. */
export function shortDate(isoDate: string, lang: Lang): string {
  return dateFormat[lang].format(new Date(`${isoDate}T06:00:00Z`));
}
