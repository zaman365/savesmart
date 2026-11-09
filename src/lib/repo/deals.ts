import type { DB } from '../db.ts';
import { tx } from '../db.ts';
import { parseSqlite } from '../dates.ts';
import { hotScore, needsModeration, temperatureFromVotes } from '../temperature.ts';

type Row = Record<string, unknown>;

export type DealStatus = 'pending' | 'published' | 'rejected' | 'expired';
export type DealTab = 'hot' | 'new' | 'discussed';

export interface Deal {
  id: number;
  userId: number;
  userName: string;
  title: string;
  body: string;
  category: string | null;
  shopName: string;
  url: string | null;
  price: number | null;
  regularPrice: number | null;
  voucherCode: string | null;
  methodId: number | null;
  methodName: string | null;
  productId: number | null;
  productSlug: string | null;
  expiresOn: string | null;
  status: DealStatus;
  temperature: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  userName: string;
  body: string;
  createdAt: string;
}

export interface NewDeal {
  title: string;
  body: string;
  category: string;
  shopName: string;
  url: string | null;
  price: number | null;
  regularPrice: number | null;
  voucherCode: string | null;
  methodId: number | null;
  expiresOn: string | null;
}

const DEAL_SELECT = `
  SELECT d.*, u.name AS user_name, pm.name AS method_name, p.slug AS product_slug
  FROM deals d
  JOIN users u ON u.id = d.user_id
  LEFT JOIN payment_methods pm ON pm.id = d.method_id
  LEFT JOIN products p ON p.id = d.product_id`;

function mapDeal(r: Row): Deal {
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    userName: String(r.user_name),
    title: String(r.title),
    body: String(r.body),
    category: r.category == null ? null : String(r.category),
    shopName: String(r.shop_name),
    url: r.url == null ? null : String(r.url),
    price: r.price == null ? null : Number(r.price),
    regularPrice: r.regular_price == null ? null : Number(r.regular_price),
    voucherCode: r.voucher_code == null ? null : String(r.voucher_code),
    methodId: r.method_id == null ? null : Number(r.method_id),
    methodName: r.method_name == null ? null : String(r.method_name),
    productId: r.product_id == null ? null : Number(r.product_id),
    productSlug: r.product_slug == null ? null : String(r.product_slug),
    expiresOn: r.expires_on == null ? null : String(r.expires_on),
    status: r.status as DealStatus,
    temperature: Number(r.temperature),
    commentCount: Number(r.comment_count),
    createdAt: String(r.created_at),
  };
}

export function isExpired(deal: Pick<Deal, 'status' | 'expiresOn'>, today: string): boolean {
  return deal.status === 'expired' || (deal.expiresOn != null && deal.expiresOn < today);
}

export function listDeals(
  db: DB,
  options: { tab: DealTab; category?: string; limit?: number; today: string; nowMs?: number },
): Deal[] {
  const limit = options.limit ?? 30;
  const params: Array<string | number> = [];
  let where = "d.status IN ('published', 'expired')";
  if (options.category) {
    where += ' AND d.category = ?';
    params.push(options.category);
  }
  const rows = (db.prepare(`${DEAL_SELECT} WHERE ${where} ORDER BY d.created_at DESC LIMIT 300`).all(...params) as Row[]).map(mapDeal);

  if (options.tab === 'new') return rows.slice(0, limit);

  if (options.tab === 'discussed') {
    const counts = db
      .prepare("SELECT deal_id, COUNT(*) AS n FROM comments WHERE created_at >= datetime('now', '-3 days') GROUP BY deal_id")
      .all() as Row[];
    const recent = new Map(counts.map((r) => [Number(r.deal_id), Number(r.n)]));
    return rows
      .filter((d) => d.commentCount > 0)
      .sort((a, b) => (recent.get(b.id) ?? 0) - (recent.get(a.id) ?? 0) || b.commentCount - a.commentCount)
      .slice(0, limit);
  }

  const now = options.nowMs ?? Date.now();
  return rows
    .filter((d) => !isExpired(d, options.today))
    .map((d) => ({ d, score: hotScore(d.temperature, parseSqlite(d.createdAt), now) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.d);
}

export function getDeal(db: DB, id: number): Deal | null {
  const row = db.prepare(`${DEAL_SELECT} WHERE d.id = ?`).get(id) as Row | undefined;
  return row ? mapDeal(row) : null;
}

export function dealsForProduct(db: DB, productId: number, limit = 5): Deal[] {
  const rows = db
    .prepare(`${DEAL_SELECT} WHERE d.product_id = ? AND d.status IN ('published', 'expired') ORDER BY d.created_at DESC LIMIT ?`)
    .all(productId, limit) as Row[];
  return rows.map(mapDeal);
}

export function dealsByUser(db: DB, userId: number): Deal[] {
  return (db.prepare(`${DEAL_SELECT} WHERE d.user_id = ? ORDER BY d.created_at DESC LIMIT 50`).all(userId) as Row[]).map(mapDeal);
}

export function pendingDeals(db: DB): Deal[] {
  return (db.prepare(`${DEAL_SELECT} WHERE d.status = 'pending' ORDER BY d.created_at`).all() as Row[]).map(mapDeal);
}

export function searchDeals(db: DB, query: string, limit = 12): Deal[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length === 0) return [];
  const where = words.map(() => "(lower(d.title) LIKE ? ESCAPE '\\' OR lower(d.shop_name) LIKE ? ESCAPE '\\')").join(' AND ');
  const params = words.flatMap((w) => {
    const like = `%${w.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return [like, like];
  });
  return (
    db
      .prepare(`${DEAL_SELECT} WHERE d.status = 'published' AND ${where} ORDER BY d.temperature DESC LIMIT ?`)
      .all(...params, limit) as Row[]
  ).map(mapDeal);
}

export function listComments(db: DB, dealId: number): Comment[] {
  const rows = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, u.name AS user_name
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.deal_id = ? ORDER BY c.created_at`,
    )
    .all(dealId) as Row[];
  return rows.map((r) => ({ id: Number(r.id), userName: String(r.user_name), body: String(r.body), createdAt: String(r.created_at) }));
}

export function userVote(db: DB, dealId: number, userId: number): -1 | 0 | 1 {
  const row = db.prepare('SELECT value FROM deal_votes WHERE deal_id = ? AND user_id = ?').get(dealId, userId) as Row | undefined;
  return row ? (Number(row.value) as -1 | 1) : 0;
}

function recomputeTemperature(db: DB, dealId: number): number {
  const row = db
    .prepare('SELECT COALESCE(SUM(value = 1), 0) AS hot, COALESCE(SUM(value = -1), 0) AS cold FROM deal_votes WHERE deal_id = ?')
    .get(dealId) as Row;
  const temperature = temperatureFromVotes(Number(row.hot), Number(row.cold));
  db.prepare('UPDATE deals SET temperature = ? WHERE id = ?').run(temperature, dealId);
  return temperature;
}

/** Casts, changes or (when repeated) withdraws a vote. Only published deals take votes. */
export function castVote(db: DB, dealId: number, userId: number, value: 1 | -1): number | null {
  return tx(db, () => {
    const deal = db.prepare("SELECT status FROM deals WHERE id = ?").get(dealId) as Row | undefined;
    if (!deal || deal.status !== 'published') return null;
    const current = userVote(db, dealId, userId);
    if (current === value) {
      db.prepare('DELETE FROM deal_votes WHERE deal_id = ? AND user_id = ?').run(dealId, userId);
    } else {
      db.prepare(
        'INSERT INTO deal_votes (deal_id, user_id, value) VALUES (?, ?, ?) ON CONFLICT (deal_id, user_id) DO UPDATE SET value = excluded.value',
      ).run(dealId, userId, value);
    }
    return recomputeTemperature(db, dealId);
  });
}

export function addComment(db: DB, dealId: number, userId: number, body: string): boolean {
  return tx(db, () => {
    const deal = db.prepare('SELECT status FROM deals WHERE id = ?').get(dealId) as Row | undefined;
    if (!deal || (deal.status !== 'published' && deal.status !== 'expired')) return false;
    db.prepare('INSERT INTO comments (deal_id, user_id, body) VALUES (?, ?, ?)').run(dealId, userId, body);
    db.prepare('UPDATE deals SET comment_count = comment_count + 1 WHERE id = ?').run(dealId);
    return true;
  });
}

export function createDeal(db: DB, user: { id: number; role: string; approvedDeals: number }, input: NewDeal): { id: number; status: DealStatus } {
  const status: DealStatus = needsModeration(user.role, user.approvedDeals) ? 'pending' : 'published';
  const result = db
    .prepare(
      `INSERT INTO deals (user_id, title, body, category, shop_name, url, price, regular_price, voucher_code, method_id, expires_on, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      user.id, input.title, input.body, input.category, input.shopName, input.url, input.price, input.regularPrice,
      input.voucherCode, input.methodId, input.expiresOn, status,
    );
  return { id: Number(result.lastInsertRowid), status };
}

export function moderateDeal(db: DB, dealId: number, action: 'approve' | 'reject' | 'expire'): boolean {
  return tx(db, () => {
    const deal = db.prepare('SELECT status, user_id FROM deals WHERE id = ?').get(dealId) as Row | undefined;
    if (!deal) return false;
    if (action === 'approve' && deal.status === 'pending') {
      db.prepare("UPDATE deals SET status = 'published', created_at = datetime('now') WHERE id = ?").run(dealId);
      db.prepare('UPDATE users SET approved_deals = approved_deals + 1 WHERE id = ?').run(Number(deal.user_id));
      return true;
    }
    if (action === 'reject' && deal.status === 'pending') {
      db.prepare("UPDATE deals SET status = 'rejected' WHERE id = ?").run(dealId);
      return true;
    }
    if (action === 'expire' && deal.status === 'published') {
      db.prepare("UPDATE deals SET status = 'expired' WHERE id = ?").run(dealId);
      return true;
    }
    return false;
  });
}

/** Counts a member's recent actions of one kind, for rate limits. */
export function recentCount(db: DB, table: 'deals' | 'comments', userId: number, minutes: number): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ? AND created_at >= datetime('now', ?)`)
    .get(userId, `-${minutes} minutes`) as Row;
  return Number(row.n);
}
