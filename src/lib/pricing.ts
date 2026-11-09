// Real price engine: shop price + delivery − the best payment offer the shopper can use.

export type Location = 'dhaka' | 'outside';
export type WarrantyType = 'official' | 'unofficial' | 'shop';

export interface ShopOffer {
  id: number;
  shopId: number;
  category: string;
  price: number;
  inStock: boolean;
  warrantyType: WarrantyType;
  deliveryDhaka: number;
  deliveryOutside: number;
}

export interface PaymentOffer {
  id: number;
  methodId: number;
  methodName: string;
  shopId: number | null;
  category: string | null;
  percent: number;
  flat: number;
  cap: number | null;
  minSpend: number;
  kind: 'discount' | 'cashback';
  startsOn: string;
  endsOn: string;
}

export interface PricingContext {
  methodIds: ReadonlySet<number>;
  location: Location;
  today: string;
}

export interface RealPrice {
  shopPrice: number;
  delivery: number;
  saving: number;
  total: number;
  paymentOffer: PaymentOffer | null;
}

/** Taka saved by one payment offer on a given price, after percent, flat amount and cap. */
export function paymentSaving(price: number, offer: Pick<PaymentOffer, 'percent' | 'flat' | 'cap'>): number {
  const raw = Math.floor((price * offer.percent) / 100) + offer.flat;
  const capped = offer.cap == null ? raw : Math.min(raw, offer.cap);
  return Math.max(0, Math.min(capped, price));
}

export function isPaymentOfferActive(offer: Pick<PaymentOffer, 'startsOn' | 'endsOn'>, today: string): boolean {
  return offer.startsOn <= today && today <= offer.endsOn;
}

export function isPaymentOfferUsable(offer: PaymentOffer, shopOffer: ShopOffer, ctx: PricingContext): boolean {
  if (!ctx.methodIds.has(offer.methodId)) return false;
  if (!isPaymentOfferActive(offer, ctx.today)) return false;
  if (offer.shopId != null && offer.shopId !== shopOffer.shopId) return false;
  if (offer.category != null && offer.category !== shopOffer.category) return false;
  return shopOffer.price >= offer.minSpend;
}

export function deliveryFee(shopOffer: ShopOffer, location: Location): number {
  return location === 'dhaka' ? shopOffer.deliveryDhaka : shopOffer.deliveryOutside;
}

export function realPrice(shopOffer: ShopOffer, paymentOffers: readonly PaymentOffer[], ctx: PricingContext): RealPrice {
  let best: PaymentOffer | null = null;
  let bestSaving = 0;
  for (const offer of paymentOffers) {
    if (!isPaymentOfferUsable(offer, shopOffer, ctx)) continue;
    const saving = paymentSaving(shopOffer.price, offer);
    if (saving > bestSaving) {
      best = offer;
      bestSaving = saving;
    }
  }
  const delivery = deliveryFee(shopOffer, ctx.location);
  return {
    shopPrice: shopOffer.price,
    delivery,
    saving: bestSaving,
    total: shopOffer.price + delivery - bestSaving,
    paymentOffer: best,
  };
}

const warrantyRank: Record<WarrantyType, number> = { official: 0, shop: 1, unofficial: 2 };

/** Ranking: lowest real price, then official warranty, then in stock, then lower shop price. No paid placement. */
export function compareRealPrices(
  a: { offer: ShopOffer; real: RealPrice },
  b: { offer: ShopOffer; real: RealPrice },
): number {
  return (
    a.real.total - b.real.total ||
    warrantyRank[a.offer.warrantyType] - warrantyRank[b.offer.warrantyType] ||
    Number(b.offer.inStock) - Number(a.offer.inStock) ||
    a.offer.price - b.offer.price
  );
}

/** Monthly EMI amount, rounded up, for 0% instalment plans. */
export function emiMonthly(price: number, months: number): number {
  return months > 0 ? Math.ceil(price / months) : 0;
}
