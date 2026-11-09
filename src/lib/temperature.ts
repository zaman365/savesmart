// Deal temperature and feed ordering.

export const DEGREES_PER_VOTE = 4;
export const TRUSTED_AFTER_APPROVED_DEALS = 3;

export type TemperatureLevel = 'cold' | 'neutral' | 'warm' | 'hot' | 'burning';

export function temperatureFromVotes(hot: number, cold: number): number {
  return (hot - cold) * DEGREES_PER_VOTE;
}

export function temperatureLevel(temperature: number): TemperatureLevel {
  if (temperature < 0) return 'cold';
  if (temperature < 50) return 'neutral';
  if (temperature < 100) return 'warm';
  if (temperature < 300) return 'hot';
  return 'burning';
}

/** "Hot" feed score: temperature that fades with age so new deals can surface. */
export function hotScore(temperature: number, createdAtMs: number, nowMs: number): number {
  const hours = Math.max(0, (nowMs - createdAtMs) / 3_600_000);
  return temperature / Math.pow(hours + 2, 1.5);
}

/** New members' deals wait for a moderator until they have this many approved deals. */
export function needsModeration(role: string, approvedDeals: number): boolean {
  return role !== 'admin' && approvedDeals < TRUSTED_AFTER_APPROVED_DEALS;
}

export function discountPercent(price: number | null, regular: number | null): number | null {
  if (!price || !regular || regular <= price) return null;
  return Math.round(((regular - price) / regular) * 100);
}
