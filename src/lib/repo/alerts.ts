import type { DB } from '../db.ts';
import { tx } from '../db.ts';
import { money } from '../format.ts';
import { listPaymentOffers, offersForProducts, priceOffers } from './catalog.ts';
import { getUserMethodIds } from './users.ts';

type Row = Record<string, unknown>;

export interface Alert {
  id: number;
  productId: number;
  productSlug: string;
  productName: string;
  targetPrice: number;
  lastTriggeredAt: string | null;
}

export interface Notification {
  id: number;
  kind: string;
  bodyBn: string;
  bodyEn: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function setAlert(db: DB, userId: number, productId: number, targetPrice: number): void {
  db.prepare(
    `INSERT INTO price_alerts (user_id, product_id, target_price) VALUES (?, ?, ?)
     ON CONFLICT (user_id, product_id) DO UPDATE SET target_price = excluded.target_price, active = 1, last_triggered_at = NULL`,
  ).run(userId, productId, targetPrice);
}

export function removeAlert(db: DB, userId: number, productId: number): void {
  db.prepare('DELETE FROM price_alerts WHERE user_id = ? AND product_id = ?').run(userId, productId);
}

export function getAlert(db: DB, userId: number, productId: number): Alert | null {
  return listAlerts(db, userId).find((a) => a.productId === productId) ?? null;
}

export function listAlerts(db: DB, userId: number): Alert[] {
  const rows = db
    .prepare(
      `SELECT a.*, p.slug, p.name FROM price_alerts a JOIN products p ON p.id = a.product_id
       WHERE a.user_id = ? AND a.active = 1 ORDER BY a.created_at DESC`,
    )
    .all(userId) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    productId: Number(r.product_id),
    productSlug: String(r.slug),
    productName: String(r.name),
    targetPrice: Number(r.target_price),
    lastTriggeredAt: r.last_triggered_at == null ? null : String(r.last_triggered_at),
  }));
}

/**
 * Compares every active alert with the member's own real price (their wallets and cards, Dhaka delivery)
 * and sends at most one notification per alert per day. Returns the number of notifications sent.
 */
export function checkAlerts(db: DB, today: string): number {
  const alerts = db
    .prepare(
      `SELECT a.id, a.user_id, a.product_id, a.target_price, p.name, p.slug FROM price_alerts a
       JOIN products p ON p.id = a.product_id
       WHERE a.active = 1 AND (a.last_triggered_at IS NULL OR a.last_triggered_at < datetime('now', '-1 day'))`,
    )
    .all() as Row[];
  if (alerts.length === 0) return 0;
  const payOffers = listPaymentOffers(db, today);
  const offers = offersForProducts(db, [...new Set(alerts.map((a) => Number(a.product_id)))]);
  let sent = 0;
  tx(db, () => {
    for (const a of alerts) {
      const methodIds = new Set(getUserMethodIds(db, Number(a.user_id)));
      const priced = priceOffers(offers.get(Number(a.product_id)) ?? [], payOffers, { methodIds, location: 'dhaka', today });
      const best = priced.find((p) => p.offer.inStock) ?? priced[0];
      if (!best || best.real.total > Number(a.target_price)) continue;
      const name = String(a.name);
      db.prepare('INSERT INTO notifications (user_id, kind, body_bn, body_en, link) VALUES (?, ?, ?, ?, ?)').run(
        Number(a.user_id),
        'price_alert',
        `${name}: আসল দাম এখন ${money(best.real.total, 'bn')}, ${best.offer.shop.name}-এ। আপনার লক্ষ্য ছিল ${money(Number(a.target_price), 'bn')}।`,
        `${name}: real price is now ${money(best.real.total, 'en')} at ${best.offer.shop.name}. Your target was ${money(Number(a.target_price), 'en')}.`,
        `/p/${String(a.slug)}`,
      );
      db.prepare("UPDATE price_alerts SET last_triggered_at = datetime('now') WHERE id = ?").run(Number(a.id));
      sent += 1;
    }
  });
  return sent;
}

export function listNotifications(db: DB, userId: number, limit = 20): Notification[] {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?').all(userId, limit) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    kind: String(r.kind),
    bodyBn: String(r.body_bn),
    bodyEn: String(r.body_en),
    link: r.link == null ? null : String(r.link),
    readAt: r.read_at == null ? null : String(r.read_at),
    createdAt: String(r.created_at),
  }));
}

export function unreadCount(db: DB, userId: number): number {
  return Number((db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL').get(userId) as Row).n);
}

export function markAllRead(db: DB, userId: number): void {
  db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(userId);
}
