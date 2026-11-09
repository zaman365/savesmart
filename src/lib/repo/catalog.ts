import type { DB } from '../db.ts';
import { addDays } from '../dates.ts';
import {
  compareRealPrices,
  realPrice,
  type PaymentOffer,
  type PricingContext,
  type RealPrice,
  type ShopOffer,
  type WarrantyType,
} from '../pricing.ts';

type Row = Record<string, unknown>;

export interface Category {
  slug: string;
  nameBn: string;
  nameEn: string;
  productCount: number;
}

export interface Shop {
  id: number;
  slug: string;
  name: string;
  city: string;
  website: string | null;
  cod: boolean;
  deliveryDhaka: number;
  deliveryOutside: number;
  isDemo: boolean;
}

export interface Offer extends ShopOffer {
  productId: number;
  regularPrice: number | null;
  warrantyMonths: number;
  emiMonths: number;
  url: string | null;
  checkedAt: string;
  source: string;
  shop: Shop;
}

export interface Product {
  id: number;
  slug: string;
  category: string;
  brand: string;
  name: string;
  summary: string;
  specs: Record<string, string>;
  releaseYear: number | null;
  popularity: number;
}

export interface PricedOffer {
  offer: Offer;
  real: RealPrice;
}

export interface ProductCard {
  product: Product;
  best: PricedOffer | null;
  shopCount: number;
  drop30: number | null;
}

export interface PaymentMethod {
  id: number;
  slug: string;
  kind: 'mfs' | 'card';
  name: string;
  issuer: string;
}

export interface PaymentOfferDetail extends PaymentOffer {
  methodSlug: string;
  shopName: string | null;
  titleBn: string;
  titleEn: string;
  source: string;
}

function mapProduct(r: Row): Product {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    category: String(r.category),
    brand: String(r.brand),
    name: String(r.name),
    summary: String(r.summary),
    specs: JSON.parse(String(r.specs_json)) as Record<string, string>,
    releaseYear: r.release_year == null ? null : Number(r.release_year),
    popularity: Number(r.popularity),
  };
}

function mapOffer(r: Row): Offer {
  return {
    id: Number(r.id),
    productId: Number(r.product_id),
    shopId: Number(r.shop_id),
    category: String(r.category),
    price: Number(r.price),
    regularPrice: r.regular_price == null ? null : Number(r.regular_price),
    inStock: Number(r.in_stock) === 1,
    warrantyType: r.warranty_type as WarrantyType,
    warrantyMonths: Number(r.warranty_months),
    emiMonths: Number(r.emi_months),
    url: r.url == null ? null : String(r.url),
    checkedAt: String(r.checked_at),
    source: String(r.source),
    deliveryDhaka: Number(r.delivery_dhaka),
    deliveryOutside: Number(r.delivery_outside),
    shop: {
      id: Number(r.shop_id),
      slug: String(r.shop_slug),
      name: String(r.shop_name),
      city: String(r.city),
      website: r.website == null ? null : String(r.website),
      cod: Number(r.cod) === 1,
      deliveryDhaka: Number(r.delivery_dhaka),
      deliveryOutside: Number(r.delivery_outside),
      isDemo: Number(r.is_demo) === 1,
    },
  };
}

const OFFER_SELECT = `
  SELECT o.*, p.category, s.slug AS shop_slug, s.name AS shop_name, s.city, s.website, s.cod,
         s.delivery_dhaka, s.delivery_outside, s.is_demo
  FROM offers o
  JOIN products p ON p.id = o.product_id
  JOIN shops s ON s.id = o.shop_id`;

export function listCategories(db: DB): Category[] {
  const rows = db
    .prepare(
      `SELECT c.slug, c.name_bn, c.name_en, COUNT(p.id) AS n
       FROM categories c LEFT JOIN products p ON p.category = c.slug
       GROUP BY c.slug ORDER BY c.sort`,
    )
    .all() as Row[];
  return rows.map((r) => ({ slug: String(r.slug), nameBn: String(r.name_bn), nameEn: String(r.name_en), productCount: Number(r.n) }));
}

export function getCategory(db: DB, slug: string): Category | null {
  return listCategories(db).find((c) => c.slug === slug) ?? null;
}

export function brandsInCategory(db: DB, category: string): string[] {
  const rows = db.prepare('SELECT DISTINCT brand FROM products WHERE category = ? ORDER BY brand').all(category) as Row[];
  return rows.map((r) => String(r.brand));
}

export function getProductBySlug(db: DB, slug: string): Product | null {
  const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug) as Row | undefined;
  return row ? mapProduct(row) : null;
}

export function getProductsByIds(db: DB, ids: number[]): Product[] {
  if (ids.length === 0) return [];
  const rows = db.prepare(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) as Row[];
  return rows.map(mapProduct);
}

export function offersForProducts(db: DB, productIds: number[]): Map<number, Offer[]> {
  const map = new Map<number, Offer[]>();
  if (productIds.length === 0) return map;
  const rows = db
    .prepare(`${OFFER_SELECT} WHERE o.product_id IN (${productIds.map(() => '?').join(',')})`)
    .all(...productIds) as Row[];
  for (const row of rows) {
    const offer = mapOffer(row);
    const list = map.get(offer.productId) ?? [];
    list.push(offer);
    map.set(offer.productId, list);
  }
  return map;
}

export function listPaymentMethods(db: DB): PaymentMethod[] {
  const rows = db.prepare('SELECT * FROM payment_methods ORDER BY sort, name').all() as Row[];
  return rows.map((r) => ({ id: Number(r.id), slug: String(r.slug), kind: r.kind as 'mfs' | 'card', name: String(r.name), issuer: String(r.issuer) }));
}

/** Payment offers that have not ended, with method and shop names. */
export function listPaymentOffers(db: DB, today: string): PaymentOfferDetail[] {
  const rows = db
    .prepare(
      `SELECT po.*, pm.name AS method_name, pm.slug AS method_slug, s.name AS shop_name
       FROM payment_offers po
       JOIN payment_methods pm ON pm.id = po.method_id
       LEFT JOIN shops s ON s.id = po.shop_id
       WHERE po.ends_on >= ?
       ORDER BY po.ends_on`,
    )
    .all(today) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    methodId: Number(r.method_id),
    methodName: String(r.method_name),
    methodSlug: String(r.method_slug),
    shopId: r.shop_id == null ? null : Number(r.shop_id),
    shopName: r.shop_name == null ? null : String(r.shop_name),
    category: r.category == null ? null : String(r.category),
    percent: Number(r.percent),
    flat: Number(r.flat),
    cap: r.cap == null ? null : Number(r.cap),
    minSpend: Number(r.min_spend),
    kind: r.kind as 'discount' | 'cashback',
    startsOn: String(r.starts_on),
    endsOn: String(r.ends_on),
    titleBn: String(r.title_bn),
    titleEn: String(r.title_en),
    source: String(r.source),
  }));
}

export function priceOffers(offers: Offer[], paymentOffers: readonly PaymentOffer[], ctx: PricingContext): PricedOffer[] {
  return offers.map((offer) => ({ offer, real: realPrice(offer, paymentOffers, ctx) })).sort(compareRealPrices);
}

/** Percent drop of today's lowest shop price against the lowest shop price 30 days ago. */
export function drops30(db: DB, productIds: number[], today: string): Map<number, number> {
  const map = new Map<number, number>();
  if (productIds.length === 0) return map;
  const marks = productIds.map(() => '?').join(',');
  const then = db
    .prepare(`SELECT product_id, MIN(price) AS p FROM price_points WHERE observed_on = ? AND product_id IN (${marks}) GROUP BY product_id`)
    .all(addDays(today, -30), ...productIds) as Row[];
  const now = db
    .prepare(`SELECT product_id, MIN(price) AS p FROM offers WHERE product_id IN (${marks}) GROUP BY product_id`)
    .all(...productIds) as Row[];
  const nowMap = new Map(now.map((r) => [Number(r.product_id), Number(r.p)]));
  for (const r of then) {
    const old = Number(r.p);
    const current = nowMap.get(Number(r.product_id));
    if (current != null && old > current) map.set(Number(r.product_id), Math.round(((old - current) / old) * 100));
  }
  return map;
}

export type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'drop';

export interface ListFilters {
  category?: string;
  ids?: number[];
  brands?: string[];
  min?: number;
  max?: number;
  official?: boolean;
  inStock?: boolean;
  emi?: boolean;
  cod?: boolean;
  sort?: SortKey;
}

export function listProducts(db: DB, filters: ListFilters, paymentOffers: readonly PaymentOffer[], ctx: PricingContext): ProductCard[] {
  const where: string[] = [];
  const params: Array<string | number> = [];
  if (filters.category) {
    where.push('category = ?');
    params.push(filters.category);
  }
  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    where.push(`id IN (${filters.ids.map(() => '?').join(',')})`);
    params.push(...filters.ids);
  }
  if (filters.brands && filters.brands.length > 0) {
    where.push(`brand IN (${filters.brands.map(() => '?').join(',')})`);
    params.push(...filters.brands);
  }
  const sql = `SELECT * FROM products ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;
  const products = (db.prepare(sql).all(...params) as Row[]).map(mapProduct);
  const ids = products.map((p) => p.id);
  const offers = offersForProducts(db, ids);
  const drops = drops30(db, ids, ctx.today);

  const cards: ProductCard[] = [];
  for (const product of products) {
    const usable = (offers.get(product.id) ?? []).filter(
      (o) =>
        (!filters.official || o.warrantyType === 'official') &&
        (!filters.inStock || o.inStock) &&
        (!filters.emi || o.emiMonths > 0) &&
        (!filters.cod || o.shop.cod),
    );
    if (usable.length === 0) continue;
    const priced = priceOffers(usable, paymentOffers, ctx);
    const best = priced[0];
    if (filters.min != null && best.real.total < filters.min) continue;
    if (filters.max != null && best.real.total > filters.max) continue;
    cards.push({ product, best, shopCount: new Set(usable.map((o) => o.shopId)).size, drop30: drops.get(product.id) ?? null });
  }

  const sort = filters.sort ?? 'popular';
  cards.sort((a, b) => {
    if (sort === 'price_asc') return (a.best?.real.total ?? 0) - (b.best?.real.total ?? 0);
    if (sort === 'price_desc') return (b.best?.real.total ?? 0) - (a.best?.real.total ?? 0);
    if (sort === 'drop') return (b.drop30 ?? -1) - (a.drop30 ?? -1) || b.product.popularity - a.product.popularity;
    return b.product.popularity - a.product.popularity;
  });
  return cards;
}

export interface HistoryPoint {
  date: string;
  price: number;
}

/** Daily lowest shop price across shops. */
export function priceHistory(db: DB, productId: number, today: string, days = 90): HistoryPoint[] {
  const rows = db
    .prepare(
      `SELECT observed_on, MIN(price) AS p FROM price_points
       WHERE product_id = ? AND observed_on > ? GROUP BY observed_on ORDER BY observed_on`,
    )
    .all(productId, addDays(today, -days)) as Row[];
  return rows.map((r) => ({ date: String(r.observed_on), price: Number(r.p) }));
}

/** Products whose name or brand contains every word of the query. */
export function searchProductIds(db: DB, query: string, limit = 24): number[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length === 0) return [];
  const where = words.map(() => "(lower(name) LIKE ? ESCAPE '\\' OR lower(brand) LIKE ? ESCAPE '\\')").join(' AND ');
  const params = words.flatMap((w) => {
    const like = `%${w.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return [like, like];
  });
  const rows = db.prepare(`SELECT id FROM products WHERE ${where} ORDER BY popularity DESC LIMIT ?`).all(...params, limit) as Row[];
  return rows.map((r) => Number(r.id));
}

export function freshness(db: DB): { offersTotal: number; offersFresh: number; packsTotal: number; packsFresh: number } {
  const o = db
    .prepare("SELECT COUNT(*) AS total, SUM(checked_at >= datetime('now', '-1 day')) AS fresh FROM offers")
    .get() as Row;
  const p = db
    .prepare("SELECT COUNT(*) AS total, SUM(checked_at >= datetime('now', '-7 days')) AS fresh FROM packs")
    .get() as Row;
  return { offersTotal: Number(o.total), offersFresh: Number(o.fresh ?? 0), packsTotal: Number(p.total), packsFresh: Number(p.fresh ?? 0) };
}
