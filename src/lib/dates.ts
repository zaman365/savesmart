// Date helpers. Calendar dates are 'YYYY-MM-DD' in Asia/Dhaka; timestamps are SQLite UTC 'YYYY-MM-DD HH:MM:SS'.

const dhakaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function todayDhaka(now: Date = new Date()): string {
  return dhakaDate.format(now);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** SQLite-style UTC timestamp for a moment `hoursAgo` hours before now. */
export function sqliteTimestamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function hoursAgo(hours: number, now: Date = new Date()): string {
  return sqliteTimestamp(new Date(now.getTime() - hours * 3_600_000));
}

/** Parses a SQLite UTC timestamp into milliseconds since epoch. */
export function parseSqlite(ts: string): number {
  return Date.parse(`${ts.replace(' ', 'T')}Z`);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}
