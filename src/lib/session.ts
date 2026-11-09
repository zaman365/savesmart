// Request-scoped viewer state for server components and server actions.

import { cookies } from 'next/headers';
import { getDb } from './db.ts';
import { todayDhaka } from './dates.ts';
import type { Location } from './pricing.ts';
import { getUserMethodIds, userForSession, type User } from './repo/users.ts';

export const SESSION_COOKIE = 'ss_session';
export const METHODS_COOKIE = 'ss_methods';
export const LOCATION_COOKIE = 'ss_loc';
export const LANG_COOKIE = 'ss_lang';

export interface Viewer {
  user: User | null;
  methodIds: Set<number>;
  location: Location;
  today: string;
}

export function parseMethodCookie(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split('.')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 30);
}

export async function getViewer(): Promise<Viewer> {
  const jar = await cookies();
  const db = getDb();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = token ? userForSession(db, token) : null;
  const methodIds = new Set(user ? getUserMethodIds(db, user.id) : parseMethodCookie(jar.get(METHODS_COOKIE)?.value));
  const location: Location = jar.get(LOCATION_COOKIE)?.value === 'outside' ? 'outside' : 'dhaka';
  return { user, methodIds, location, today: todayDhaka() };
}

export function cookieOptions(maxAgeDays: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeDays * 86_400,
  };
}
