'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb, isDemo, openDb, defaultDbPath } from '@/lib/db';
import { isLang, type Lang } from '@/lib/format';
import { hashPassword, verifyPassword } from '@/lib/password';
import { allow } from '@/lib/ratelimit';
import { addComment, castVote, createDeal, moderateDeal, recentCount } from '@/lib/repo/deals';
import { checkAlerts, markAllRead, removeAlert, setAlert } from '@/lib/repo/alerts';
import { listCategories, listPaymentMethods } from '@/lib/repo/catalog';
import { createSession, createUser, deleteSession, findUserByEmail, setUserMethods } from '@/lib/repo/users';
import {
  LANG_COOKIE,
  LOCATION_COOKIE,
  METHODS_COOKIE,
  SESSION_COOKIE,
  cookieOptions,
  getViewer,
  parseMethodCookie,
} from '@/lib/session';
import { todayDhaka } from '@/lib/dates';
import { email, longText, optionalDate, optionalTaka, optionalText, optionalUrl, safePath, text } from '@/lib/validate';
import type { Key } from '@/lib/i18n';

function langOf(form: FormData): Lang {
  const raw = String(form.get('lang') ?? 'bn');
  return isLang(raw) ? raw : 'bn';
}

function withParam(path: string, key: string, value: string): string {
  const [base, hash] = path.split('#');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${key}=${encodeURIComponent(value)}${hash ? `#${hash}` : ''}`;
}

function fail(path: string, error: Key): never {
  redirect(withParam(path, 'error', error));
}

async function requireUser(lang: Lang, returnTo: string) {
  const viewer = await getViewer();
  if (!viewer.user) redirect(`/${lang}/account?next=${encodeURIComponent(returnTo)}`);
  return viewer.user;
}

async function startSession(userId: number, lang: Lang) {
  const db = getDb();
  const jar = await cookies();
  // Wallets picked as a guest carry over into the new account.
  const guestMethods = parseMethodCookie(jar.get(METHODS_COOKIE)?.value);
  if (guestMethods.length > 0) {
    const existing = db.prepare('SELECT COUNT(*) AS n FROM user_methods WHERE user_id = ?').get(userId) as { n: number };
    if (existing.n === 0) setUserMethods(db, userId, guestMethods);
  }
  jar.set(SESSION_COOKIE, createSession(db, userId), cookieOptions(30));
  jar.set(LANG_COOKIE, lang, { ...cookieOptions(365), httpOnly: false });
}

export async function savePreferences(form: FormData) {
  const lang = langOf(form);
  const returnTo = safePath(form.get('returnTo'), `/${lang}`);
  const db = getDb();
  const jar = await cookies();
  const viewer = await getViewer();

  if (form.has('methodsSubmitted')) {
    const valid = new Set(listPaymentMethods(db).map((m) => m.id));
    const ids = form
      .getAll('method')
      .map((v) => Number(v))
      .filter((id) => valid.has(id));
    if (viewer.user) setUserMethods(db, viewer.user.id, ids);
    jar.set(METHODS_COOKIE, ids.join('.'), cookieOptions(365));
  }
  const location = form.get('location');
  if (location === 'dhaka' || location === 'outside') jar.set(LOCATION_COOKIE, location, cookieOptions(365));

  revalidatePath('/', 'layout');
  redirect(form.has('methodsSubmitted') ? withParam(returnTo, 'saved', '1') : returnTo);
}

export async function register(form: FormData) {
  const lang = langOf(form);
  const back = `/${lang}/account`;
  const next = safePath(form.get('next'), back);
  const address = email(form, 'email');
  const name = text(form, 'name', 2, 60);
  const password = form.get('password');
  if (!address) fail(back, 'errBadEmail');
  if (!name) fail(back, 'errName');
  if (typeof password !== 'string' || password.length < 10 || password.length > 200) fail(back, 'errWeakPassword');
  if (form.get('consent') !== 'yes') fail(back, 'errConsent');
  if (!allow(`register:${address}`, 5, 15 * 60_000)) fail(back, 'errRate');

  const db = getDb();
  if (findUserByEmail(db, address)) fail(back, 'errEmailTaken');
  const userId = createUser(db, { email: address, name, passwordHash: await hashPassword(password) });
  await startSession(userId, lang);
  redirect(next);
}

export async function signIn(form: FormData) {
  const lang = langOf(form);
  const back = `/${lang}/account`;
  const next = safePath(form.get('next'), back);
  const address = email(form, 'email');
  const password = form.get('password');
  if (!address || typeof password !== 'string') fail(back, 'errInvalidLogin');
  if (!allow(`login:${address}`, 10, 15 * 60_000)) fail(back, 'errRate');

  const db = getDb();
  const user = findUserByEmail(db, address);
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) fail(back, 'errInvalidLogin');
  await startSession(user.id, lang);
  redirect(next);
}

export async function signOut(form: FormData) {
  const lang = langOf(form);
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(getDb(), token);
  jar.delete(SESSION_COOKIE);
  redirect(`/${lang}`);
}

export async function vote(form: FormData) {
  const lang = langOf(form);
  const dealId = Number(form.get('dealId'));
  const returnTo = safePath(form.get('returnTo'), `/${lang}/deals/${dealId}`);
  const user = await requireUser(lang, returnTo);
  const value = form.get('value') === '1' ? 1 : form.get('value') === '-1' ? -1 : null;
  if (!Number.isInteger(dealId) || value == null) redirect(returnTo);
  if (!allow(`vote:${user.id}`, 60, 10 * 60_000)) fail(returnTo, 'errRate');
  castVote(getDb(), dealId, user.id, value);
  // Feeds redirect back to the same page with only an anchor, so drop every cached page view.
  revalidatePath('/', 'layout');
  redirect(returnTo);
}

export async function comment(form: FormData) {
  const lang = langOf(form);
  const dealId = Number(form.get('dealId'));
  const back = `/${lang}/deals/${dealId}`;
  const user = await requireUser(lang, back);
  const body = longText(form, 'body', 2, 1000);
  if (!body) fail(`${back}#comment-form`, 'errComment');
  const db = getDb();
  if (recentCount(db, 'comments', user.id, 10) >= 10) fail(back, 'errRate');
  addComment(db, dealId, user.id, body);
  revalidatePath('/', 'layout');
  redirect(`${back}#comments`);
}

export async function postDeal(form: FormData) {
  const lang = langOf(form);
  const back = `/${lang}/deals/new`;
  const user = await requireUser(lang, back);
  const db = getDb();

  const title = text(form, 'title', 10, 140);
  const shopName = text(form, 'shop', 2, 80);
  const category = String(form.get('category') ?? '');
  const price = optionalTaka(form, 'price');
  const regularPrice = optionalTaka(form, 'regular');
  const url = optionalUrl(form, 'url');
  const voucherCode = optionalText(form, 'code', 40);
  const expiresOn = optionalDate(form, 'expires');
  const body = longText(form, 'body', 0, 2000) ?? '';
  const methodRaw = Number(form.get('method') || 0);

  if (!title) fail(back, 'errTitle');
  if (!shopName) fail(back, 'errShop');
  if (!listCategories(db).some((c) => c.slug === category)) fail(back, 'errCategory');
  if (price === undefined || regularPrice === undefined) fail(back, 'errPrice');
  if (url === undefined) fail(back, 'errLink');
  if (voucherCode === undefined || expiresOn === undefined) fail(back, 'errTitle');
  const methodId = listPaymentMethods(db).some((m) => m.id === methodRaw) ? methodRaw : null;
  if (recentCount(db, 'deals', user.id, 60) >= 5) fail(back, 'errRate');

  const { id, status } = createDeal(db, user, {
    title, body, category, shopName, url, price, regularPrice, voucherCode, methodId, expiresOn,
  });
  redirect(status === 'pending' ? `/${lang}/deals/${id}?posted=pending` : `/${lang}/deals/${id}`);
}

export async function saveAlert(form: FormData) {
  const lang = langOf(form);
  const productId = Number(form.get('productId'));
  const back = safePath(form.get('returnTo'), `/${lang}`);
  const user = await requireUser(lang, back);
  const target = optionalTaka(form, 'target');
  if (!target || !Number.isInteger(productId)) fail(`${back}#alert`, 'errTarget');
  const db = getDb();
  const exists = db.prepare('SELECT 1 FROM products WHERE id = ?').get(productId);
  if (!exists) redirect(back);
  setAlert(db, user.id, productId, target);
  checkAlerts(db, todayDhaka());
  redirect(withParam(back, 'alert', 'saved') + '#alert');
}

export async function deleteAlert(form: FormData) {
  const lang = langOf(form);
  const productId = Number(form.get('productId'));
  const back = safePath(form.get('returnTo'), `/${lang}/account`);
  const user = await requireUser(lang, back);
  removeAlert(getDb(), user.id, productId);
  redirect(back);
}

export async function readNotifications(form: FormData) {
  const lang = langOf(form);
  const user = await requireUser(lang, `/${lang}/account`);
  markAllRead(getDb(), user.id);
  revalidatePath('/', 'layout');
  redirect(`/${lang}/account#notifications`);
}

async function requireAdmin(lang: Lang) {
  const user = await requireUser(lang, `/${lang}/admin`);
  if (user.role !== 'admin') redirect(`/${lang}/admin`);
  return user;
}

export async function moderate(form: FormData) {
  const lang = langOf(form);
  await requireAdmin(lang);
  const action = form.get('action');
  const dealId = Number(form.get('dealId'));
  if ((action === 'approve' || action === 'reject' || action === 'expire') && Number.isInteger(dealId)) {
    moderateDeal(getDb(), dealId, action);
  }
  revalidatePath(`/${lang}/deals`);
  redirect(`/${lang}/admin`);
}

export async function runAlertCheck(form: FormData) {
  const lang = langOf(form);
  await requireAdmin(lang);
  const sent = checkAlerts(getDb(), todayDhaka());
  redirect(`/${lang}/admin?alerts=${sent}`);
}

export async function resetDemo(form: FormData) {
  const lang = langOf(form);
  await requireAdmin(lang);
  if (!isDemo()) redirect(`/${lang}/admin`);
  const db = getDb();
  const tables = [
    'notifications', 'price_alerts', 'comments', 'deal_votes', 'deals', 'user_methods', 'sessions', 'users',
    'packs', 'operators', 'payment_offers', 'payment_methods', 'price_points', 'offers', 'products', 'shops', 'categories', 'meta',
  ];
  db.exec('PRAGMA foreign_keys = OFF');
  for (const table of tables) db.exec(`DELETE FROM ${table}`);
  db.exec('PRAGMA foreign_keys = ON');
  db.close();
  (globalThis as unknown as { __savesmartDb?: unknown }).__savesmartDb = openDb(defaultDbPath(), { demo: true });
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect(`/${lang}/account`);
}
