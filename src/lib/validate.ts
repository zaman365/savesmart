// Small, strict form validators. Each returns a value or null when the input is invalid.

export function text(form: FormData, key: string, min: number, max: number): string | null {
  const raw = form.get(key);
  if (typeof raw !== 'string') return null;
  const value = raw.replace(/\s+/g, ' ').trim();
  return value.length >= min && value.length <= max ? value : null;
}

/** Multi-line text: keeps line breaks, trims, collapses runs of blank lines. */
export function longText(form: FormData, key: string, min: number, max: number): string | null {
  const raw = form.get(key);
  if (typeof raw !== 'string') return null;
  const value = raw.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return value.length >= min && value.length <= max ? value : null;
}

export function optionalText(form: FormData, key: string, max: number): string | null | undefined {
  const raw = form.get(key);
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) return null;
  if (typeof raw !== 'string') return undefined;
  const value = raw.replace(/\s+/g, ' ').trim();
  return value.length <= max ? value : undefined;
}

/** Whole taka. Accepts Bangla digits and commas. Returns null when empty, undefined when invalid. */
export function optionalTaka(form: FormData, key: string): number | null | undefined {
  const raw = form.get(key);
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) return null;
  if (typeof raw !== 'string') return undefined;
  const normalised = raw.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/[,\s৳]/g, '');
  if (!/^\d{1,8}$/.test(normalised)) return undefined;
  const value = Number(normalised);
  return value >= 1 && value <= 10_000_000 ? value : undefined;
}

export function intInRange(raw: string | null | undefined, min: number, max: number, fallback: number): number {
  if (raw == null || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function email(form: FormData, key: string): string | null {
  const value = text(form, key, 3, 254);
  if (!value) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value.toLowerCase() : null;
}

export function optionalUrl(form: FormData, key: string): string | null | undefined {
  const value = optionalText(form, key, 500);
  if (value == null) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function optionalDate(form: FormData, key: string): string | null | undefined {
  const value = optionalText(form, key, 10);
  if (value == null) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

/** Only same-site relative paths are allowed as redirect targets. */
export function safePath(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  return raw.slice(0, 500);
}
