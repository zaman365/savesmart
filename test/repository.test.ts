import { beforeEach, describe, expect, it } from 'vitest';
import { openDb, type DB } from '../src/lib/db.ts';
import { todayDhaka } from '../src/lib/dates.ts';
import { hashPasswordSync, verifyPassword } from '../src/lib/password.ts';
import { checkAlerts, listNotifications, setAlert } from '../src/lib/repo/alerts.ts';
import { getProductBySlug, listPaymentOffers, listProducts, searchProductIds } from '../src/lib/repo/catalog.ts';
import { addComment, castVote, createDeal, getDeal, listDeals, moderateDeal } from '../src/lib/repo/deals.ts';
import { createSession, createUser, deleteSession, findUserByEmail, getUserMethodIds, setUserMethods, userForSession } from '../src/lib/repo/users.ts';

let db: DB;
const today = todayDhaka();

function member(email: string, approved = 0) {
  const id = createUser(db, { email, name: email.split('@')[0], passwordHash: hashPasswordSync('long-enough-pw') });
  db.prepare('UPDATE users SET approved_deals = ? WHERE id = ?').run(approved, id);
  return findUserByEmail(db, email)!;
}

beforeEach(() => {
  db = openDb(':memory:', { demo: true });
});

describe('demo seed', () => {
  it('fills every engine', () => {
    const count = (t: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    expect(count('products')).toBeGreaterThan(20);
    expect(count('offers')).toBeGreaterThan(count('products') * 2);
    expect(count('packs')).toBeGreaterThan(20);
    expect(count('deals')).toBeGreaterThan(10);
    expect((db.prepare('SELECT COUNT(*) AS n FROM shops WHERE is_demo = 0').get() as { n: number }).n).toBe(0);
  });

  it('never seeds twice', () => {
    const before = (db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }).n;
    const again = openDb(':memory:', { demo: false });
    expect((again.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }).n).toBe(0);
    expect(before).toBeGreaterThan(0);
  });
});

describe('catalogue', () => {
  it('filters to official warranty and finds the best real price', () => {
    const ctx = { methodIds: new Set<number>(), location: 'dhaka' as const, today };
    const cards = listProducts(db, { category: 'phones', official: true, sort: 'price_asc' }, listPaymentOffers(db, today), ctx);
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(c.best!.offer.warrantyType).toBe('official');
    const totals = cards.map((c) => c.best!.real.total);
    expect([...totals].sort((a, b) => a - b)).toEqual(totals);
  });

  it('searches by brand and model words', () => {
    const ids = searchProductIds(db, 'redmi pro');
    expect(ids).toContain(getProductBySlug(db, 'xiaomi-redmi-note-14-pro-8-256')!.id);
    expect(searchProductIds(db, '%')).toEqual([]);
  });
});

describe('deals', () => {
  it('holds a new member’s deal for review and publishes a trusted member’s', () => {
    const fresh = member('fresh@example.com', 0);
    const trusted = member('trusted@example.com', 3);
    const input = { title: 'Test deal title long enough', body: '', category: 'phones', shopName: 'Shop', url: null, price: 1000, regularPrice: null, voucherCode: null, methodId: null, expiresOn: null };
    expect(createDeal(db, fresh, input).status).toBe('pending');
    expect(createDeal(db, trusted, input).status).toBe('published');
  });

  it('approving publishes the deal and counts toward trust', () => {
    const fresh = member('fresh@example.com', 0);
    const { id } = createDeal(db, fresh, { title: 'Pending deal title here', body: '', category: 'tvs', shopName: 'Shop', url: null, price: null, regularPrice: null, voucherCode: null, methodId: null, expiresOn: null });
    expect(castVote(db, id, fresh.id, 1)).toBeNull();
    expect(addComment(db, id, fresh.id, 'hello')).toBe(false);
    expect(moderateDeal(db, id, 'approve')).toBe(true);
    expect(getDeal(db, id)!.status).toBe('published');
    expect(findUserByEmail(db, 'fresh@example.com')!.approvedDeals).toBe(1);
    expect(moderateDeal(db, id, 'approve')).toBe(false);
  });

  it('one vote per member, changeable and withdrawable', () => {
    const voter = member('voter@example.com');
    const deal = listDeals(db, { tab: 'hot', today })[0];
    const start = deal.temperature;
    expect(castVote(db, deal.id, voter.id, 1)).toBe(start + 4);
    expect(castVote(db, deal.id, voter.id, -1)).toBe(start - 4);
    expect(castVote(db, deal.id, voter.id, -1)).toBe(start);
  });

  it('keeps expired deals out of the hot feed', () => {
    const hot = listDeals(db, { tab: 'hot', today, limit: 100 });
    expect(hot.some((d) => d.status === 'expired')).toBe(false);
    expect(listDeals(db, { tab: 'new', today, limit: 100 }).some((d) => d.status === 'expired')).toBe(true);
  });
});

describe('accounts and alerts', () => {
  it('stores only a hash of the session token and expires sessions on sign-out', () => {
    const user = member('s@example.com');
    const token = createSession(db, user.id);
    const stored = db.prepare('SELECT token_hash FROM sessions WHERE user_id = ?').get(user.id) as { token_hash: string };
    expect(stored.token_hash).not.toBe(token);
    expect(userForSession(db, token)!.id).toBe(user.id);
    deleteSession(db, token);
    expect(userForSession(db, token)).toBeNull();
  });

  it('rejects an expired session', () => {
    const user = member('e@example.com');
    const token = createSession(db, user.id);
    db.prepare("UPDATE sessions SET expires_at = datetime('now', '-1 minute')").run();
    expect(userForSession(db, token)).toBeNull();
  });

  it('verifies passwords', async () => {
    const hash = hashPasswordSync('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
    expect(await verifyPassword('x', 'locked$demo-voter')).toBe(false);
  });

  it('saves only known payment methods', () => {
    const user = member('m@example.com');
    setUserMethods(db, user.id, [1, 2, 9999]);
    expect(getUserMethodIds(db, user.id).sort()).toEqual([1, 2]);
  });

  it('notifies once when the real price reaches the target', () => {
    const user = member('a@example.com');
    const product = getProductBySlug(db, 'jbl-flip-6')!;
    checkAlerts(db, today); // the demo member's seeded alert fires first
    setAlert(db, user.id, product.id, 1);
    expect(checkAlerts(db, today)).toBe(0);
    setAlert(db, user.id, product.id, 100000);
    expect(checkAlerts(db, today)).toBe(1);
    expect(checkAlerts(db, today)).toBe(0);
    expect(listNotifications(db, user.id)[0].bodyEn).toContain('JBL Flip 6');
  });
});
