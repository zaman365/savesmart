import { describe, expect, it } from 'vitest';
import { money } from '../src/lib/format.ts';
import { coversUsage, evaluatePack, rankPacks, type Pack } from '../src/lib/packs.ts';
import { compareRealPrices, emiMonthly, paymentSaving, realPrice, type PaymentOffer, type ShopOffer } from '../src/lib/pricing.ts';
import { discountPercent, hotScore, needsModeration, temperatureFromVotes, temperatureLevel } from '../src/lib/temperature.ts';
import { optionalTaka, safePath } from '../src/lib/validate.ts';

const shop = (over: Partial<ShopOffer> = {}): ShopOffer => ({
  id: 1,
  shopId: 10,
  category: 'phones',
  price: 30000,
  inStock: true,
  warrantyType: 'official',
  deliveryDhaka: 60,
  deliveryOutside: 120,
  ...over,
});

const pay = (over: Partial<PaymentOffer> = {}): PaymentOffer => ({
  id: 1,
  methodId: 100,
  methodName: 'bKash',
  shopId: null,
  category: null,
  percent: 10,
  flat: 0,
  cap: 300,
  minSpend: 0,
  kind: 'cashback',
  startsOn: '2026-11-01',
  endsOn: '2026-11-30',
  ...over,
});

const ctx = { methodIds: new Set([100]), location: 'dhaka' as const, today: '2026-11-09' };

describe('real price', () => {
  it('caps a percentage saving', () => {
    expect(paymentSaving(30000, { percent: 10, flat: 0, cap: 300 })).toBe(300);
    expect(paymentSaving(2000, { percent: 10, flat: 0, cap: 300 })).toBe(200);
  });

  it('adds a flat amount and never saves more than the price', () => {
    expect(paymentSaving(500, { percent: 0, flat: 1000, cap: null })).toBe(500);
  });

  it('adds delivery for the chosen location', () => {
    expect(realPrice(shop(), [], ctx).total).toBe(30060);
    expect(realPrice(shop(), [], { ...ctx, location: 'outside' }).total).toBe(30120);
  });

  it('uses the best usable offer only', () => {
    const offers = [pay({ id: 1, cap: 300 }), pay({ id: 2, percent: 5, cap: 1500 }), pay({ id: 3, methodId: 999, cap: 5000 })];
    const real = realPrice(shop(), offers, ctx);
    expect(real.paymentOffer?.id).toBe(2);
    expect(real.saving).toBe(1500);
    expect(real.total).toBe(30000 + 60 - 1500);
  });

  it('ignores offers for other shops, other categories, ended offers and unmet minimum spend', () => {
    expect(realPrice(shop(), [pay({ shopId: 11 })], ctx).saving).toBe(0);
    expect(realPrice(shop(), [pay({ category: 'laptops' })], ctx).saving).toBe(0);
    expect(realPrice(shop(), [pay({ endsOn: '2026-11-08' })], ctx).saving).toBe(0);
    expect(realPrice(shop(), [pay({ startsOn: '2026-11-10' })], ctx).saving).toBe(0);
    expect(realPrice(shop(), [pay({ minSpend: 40000 })], ctx).saving).toBe(0);
  });

  it('offers apply on their first and last day', () => {
    expect(realPrice(shop(), [pay({ startsOn: '2026-11-09', endsOn: '2026-11-09' })], ctx).saving).toBe(300);
  });

  it('ranks by real price, then official warranty, then stock', () => {
    const a = { offer: shop({ id: 1, warrantyType: 'unofficial' }), real: realPrice(shop(), [], ctx) };
    const b = { offer: shop({ id: 2, warrantyType: 'official' }), real: realPrice(shop(), [], ctx) };
    const c = { offer: shop({ id: 3, inStock: false }), real: realPrice(shop(), [], ctx) };
    expect([a, c, b].sort(compareRealPrices).map((x) => x.offer.id)).toEqual([2, 3, 1]);
  });

  it('rounds EMI up', () => {
    expect(emiMonthly(10000, 3)).toBe(3334);
    expect(emiMonthly(10000, 0)).toBe(0);
  });
});

describe('pack ranking', () => {
  const p = (over: Partial<Pack>): Pack => ({ id: 1, operator: 'gp', name: '', price: 100, dataMb: 0, minutes: 0, validityDays: 30, kind: 'data', ...over });

  it('buys a 7-day pack five times a month', () => {
    const r = evaluatePack(p({ dataMb: 40 * 1024, validityDays: 7, price: 249 }), { dataGb: 10, minutes: 0 });
    expect(r.packsNeeded).toBe(5);
    expect(r.monthlyCost).toBe(1245);
  });

  it('buys enough volume for heavy use', () => {
    const r = evaluatePack(p({ dataMb: 10 * 1024, validityDays: 30, price: 300 }), { dataGb: 25, minutes: 0 });
    expect(r.packsNeeded).toBe(3);
    expect(r.unusedGb).toBe(5);
  });

  it('treats no-expiry packs by volume only', () => {
    expect(evaluatePack(p({ dataMb: 26 * 1024, validityDays: null }), { dataGb: 20, minutes: 0 }).packsNeeded).toBe(1);
  });

  it('separates packs that cover only part of the use', () => {
    const packs = [p({ id: 1, dataMb: 30 * 1024, price: 500 }), p({ id: 2, dataMb: 20 * 1024, minutes: 300, price: 650, kind: 'combo' }), p({ id: 3, minutes: 500, price: 425, kind: 'voice' })];
    const { full, partial } = rankPacks(packs, { dataGb: 20, minutes: 200 });
    expect(full.map((r) => r.pack.id)).toEqual([2]);
    expect(partial.map((r) => r.pack.id).sort()).toEqual([1, 3]);
    expect(coversUsage(packs[0], { dataGb: 5, minutes: 0 })).toBe(true);
  });
});

describe('deal temperature', () => {
  it('counts 4 degrees per vote', () => {
    expect(temperatureFromVotes(66, 4)).toBe(248);
    expect(temperatureLevel(-8)).toBe('cold');
    expect(temperatureLevel(120)).toBe('hot');
    expect(temperatureLevel(320)).toBe('burning');
  });

  it('lets a fresh deal outrank an older hotter one', () => {
    const now = Date.parse('2026-11-09T12:00:00Z');
    const fresh = hotScore(60, now - 2 * 3_600_000, now);
    const old = hotScore(200, now - 72 * 3_600_000, now);
    expect(fresh).toBeGreaterThan(old);
  });

  it('moderates new members only', () => {
    expect(needsModeration('member', 0)).toBe(true);
    expect(needsModeration('member', 3)).toBe(false);
    expect(needsModeration('admin', 0)).toBe(false);
  });

  it('computes discount percent only for real discounts', () => {
    expect(discountPercent(31499, 33999)).toBe(7);
    expect(discountPercent(100, 90)).toBeNull();
  });
});

describe('formatting and input', () => {
  it('formats taka with lakh grouping in both languages', () => {
    expect(money(124999, 'en')).toBe('৳1,24,999');
    expect(money(124999, 'bn')).toBe('৳১,২৪,৯৯৯');
  });

  it('accepts Bangla digits and commas in prices', () => {
    const form = new FormData();
    form.set('a', '৩৯,৯০০');
    form.set('b', '12.5');
    form.set('c', '');
    expect(optionalTaka(form, 'a')).toBe(39900);
    expect(optionalTaka(form, 'b')).toBeUndefined();
    expect(optionalTaka(form, 'c')).toBeNull();
  });

  it('only allows same-site redirect paths', () => {
    expect(safePath('/bn/deals', '/x')).toBe('/bn/deals');
    expect(safePath('//evil.example', '/x')).toBe('/x');
    expect(safePath('https://evil.example', '/x')).toBe('/x');
    expect(safePath('/\\evil', '/x')).toBe('/x');
  });
});
