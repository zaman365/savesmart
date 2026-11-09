// Demo data. Every shop, price, offer, deal and pack here is illustrative.
// Shop names are invented. Do not present these numbers as live prices.

import type { DatabaseSync } from 'node:sqlite';
import { addDays, hoursAgo, todayDhaka } from './dates.ts';
import { hashPasswordSync } from './password.ts';
import { temperatureFromVotes } from './temperature.ts';

export const DEMO_ADMIN_EMAIL = 'admin@savesmart.local';
export const DEMO_MEMBER_EMAIL = 'rafi@savesmart.local';
export const DEMO_PASSWORD = 'demo-pass-2026';

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bangladeshi shop-style price: rounded to 100, sometimes ending in 99. */
function shopRound(value: number, r: () => number): number {
  const hundred = Math.round(value / 100) * 100;
  return r() < 0.45 ? hundred - 1 : hundred;
}

export const CATEGORIES: Array<[slug: string, bn: string, en: string]> = [
  ['phones', 'মোবাইল ফোন', 'Mobile phones'],
  ['laptops', 'ল্যাপটপ', 'Laptops'],
  ['tvs', 'টিভি', 'Televisions'],
  ['acs', 'এসি', 'Air conditioners'],
  ['fridges', 'ফ্রিজ', 'Refrigerators'],
  ['audio', 'হেডফোন ও স্পিকার', 'Headphones & speakers'],
  ['telecom', 'মোবাইল প্যাক ও রিচার্জ', 'Mobile packs & recharge'],
  ['food', 'খাবার ও গ্রোসারি', 'Food & groceries'],
  ['fashion', 'পোশাক', 'Fashion'],
  ['travel', 'ভ্রমণ', 'Travel'],
];

const SHOPS: Array<{ slug: string; name: string; city: string; dhaka: number; outside: number; cod: number }> = [
  { slug: 'padma-tech', name: 'Padma Tech', city: 'Dhaka', dhaka: 60, outside: 120, cod: 1 },
  { slug: 'meghna-digital', name: 'Meghna Digital', city: 'Dhaka', dhaka: 80, outside: 150, cod: 1 },
  { slug: 'jamuna-gadget-point', name: 'Jamuna Gadget Point', city: 'Dhaka', dhaka: 70, outside: 130, cod: 1 },
  { slug: 'karnaphuli-electronics', name: 'Karnaphuli Electronics', city: 'Chattogram', dhaka: 110, outside: 110, cod: 1 },
  { slug: 'surma-mobile-hub', name: 'Surma Mobile Hub', city: 'Sylhet', dhaka: 120, outside: 120, cod: 0 },
  { slug: 'bazaar24', name: 'Bazaar24', city: 'Dhaka', dhaka: 49, outside: 99, cod: 1 },
];

type ProductSeed = {
  slug: string;
  category: string;
  brand: string;
  name: string;
  base: number;
  year: number;
  popularity: number;
  summary: string;
  specs: Record<string, string>;
  unofficial?: boolean;
};

const PRODUCTS: ProductSeed[] = [
  { slug: 'samsung-galaxy-a56-5g-8-256', category: 'phones', brand: 'Samsung', name: 'Samsung Galaxy A56 5G (8/256GB)', base: 52999, year: 2025, popularity: 96, summary: '6.7" AMOLED, Exynos 1580, 5000 mAh', specs: { Display: '6.7" Super AMOLED, 120 Hz', Chipset: 'Exynos 1580', RAM: '8 GB', Storage: '256 GB', Battery: '5000 mAh, 45 W', 'Main camera': '50 MP' }, unofficial: true },
  { slug: 'samsung-galaxy-a16-6-128', category: 'phones', brand: 'Samsung', name: 'Samsung Galaxy A16 (6/128GB)', base: 20999, year: 2024, popularity: 88, summary: '6.7" AMOLED, 6 years of updates', specs: { Display: '6.7" Super AMOLED, 90 Hz', Chipset: 'Helio G99', RAM: '6 GB', Storage: '128 GB', Battery: '5000 mAh, 25 W', 'Main camera': '50 MP' } },
  { slug: 'xiaomi-redmi-note-14-pro-8-256', category: 'phones', brand: 'Xiaomi', name: 'Xiaomi Redmi Note 14 Pro (8/256GB)', base: 33999, year: 2025, popularity: 99, summary: '200 MP camera, 120 Hz AMOLED', specs: { Display: '6.67" AMOLED, 120 Hz', Chipset: 'Helio G100 Ultra', RAM: '8 GB', Storage: '256 GB', Battery: '5500 mAh, 45 W', 'Main camera': '200 MP' }, unofficial: true },
  { slug: 'xiaomi-redmi-a5-4-128', category: 'phones', brand: 'Xiaomi', name: 'Xiaomi Redmi A5 (4/128GB)', base: 12999, year: 2025, popularity: 80, summary: 'Big battery for everyday use', specs: { Display: '6.88" LCD, 120 Hz', Chipset: 'Unisoc T7250', RAM: '4 GB', Storage: '128 GB', Battery: '5200 mAh', 'Main camera': '32 MP' } },
  { slug: 'realme-14-pro-plus-12-256', category: 'phones', brand: 'Realme', name: 'Realme 14 Pro+ 5G (12/256GB)', base: 49999, year: 2025, popularity: 74, summary: 'Periscope telephoto, curved display', specs: { Display: '6.83" AMOLED, 120 Hz', Chipset: 'Snapdragon 7s Gen 3', RAM: '12 GB', Storage: '256 GB', Battery: '6000 mAh, 80 W', 'Main camera': '50 MP + 50 MP periscope' } },
  { slug: 'realme-c75-8-128', category: 'phones', brand: 'Realme', name: 'Realme C75 (8/128GB)', base: 19499, year: 2024, popularity: 70, summary: 'IP69 water resistance, 6000 mAh', specs: { Display: '6.72" LCD, 90 Hz', Chipset: 'Helio G92 Max', RAM: '8 GB', Storage: '128 GB', Battery: '6000 mAh, 45 W', 'Main camera': '50 MP' } },
  { slug: 'apple-iphone-16-128', category: 'phones', brand: 'Apple', name: 'Apple iPhone 16 (128GB)', base: 124999, year: 2024, popularity: 92, summary: 'A18 chip, Camera Control button', specs: { Display: '6.1" OLED', Chipset: 'Apple A18', Storage: '128 GB', Battery: 'Up to 22 h video', 'Main camera': '48 MP' }, unofficial: true },
  { slug: 'apple-iphone-17-256', category: 'phones', brand: 'Apple', name: 'Apple iPhone 17 (256GB)', base: 154999, year: 2025, popularity: 90, summary: '120 Hz ProMotion on the base model', specs: { Display: '6.3" OLED, 120 Hz', Chipset: 'Apple A19', Storage: '256 GB', 'Main camera': '48 MP' }, unofficial: true },
  { slug: 'tecno-camon-40-8-256', category: 'phones', brand: 'Tecno', name: 'Tecno Camon 40 (8/256GB)', base: 26999, year: 2025, popularity: 66, summary: 'AMOLED, 45 W charging', specs: { Display: '6.78" AMOLED, 120 Hz', Chipset: 'Helio G100', RAM: '8 GB', Storage: '256 GB', Battery: '5200 mAh, 45 W' } },
  { slug: 'infinix-note-50-8-256', category: 'phones', brand: 'Infinix', name: 'Infinix Note 50 (8/256GB)', base: 25999, year: 2025, popularity: 64, summary: 'AMOLED, metal frame', specs: { Display: '6.78" AMOLED, 144 Hz', Chipset: 'Helio G100 Ultimate', RAM: '8 GB', Storage: '256 GB', Battery: '5200 mAh, 45 W' } },
  { slug: 'hp-15-core-i5-1334u-16-512', category: 'laptops', brand: 'HP', name: 'HP 15 (Core i5-1334U, 16GB, 512GB SSD)', base: 74500, year: 2024, popularity: 85, summary: 'Everyday office and study laptop', specs: { Processor: 'Intel Core i5-1334U', RAM: '16 GB DDR4', Storage: '512 GB SSD', Display: '15.6" FHD IPS', Weight: '1.59 kg' } },
  { slug: 'lenovo-ideapad-slim-3-ryzen-5-7530u', category: 'laptops', brand: 'Lenovo', name: 'Lenovo IdeaPad Slim 3 (Ryzen 5 7530U, 16GB, 512GB)', base: 66500, year: 2024, popularity: 82, summary: 'Light, long battery life', specs: { Processor: 'AMD Ryzen 5 7530U', RAM: '16 GB', Storage: '512 GB SSD', Display: '15.6" FHD', Weight: '1.62 kg' } },
  { slug: 'asus-vivobook-15-core-i3-1215u', category: 'laptops', brand: 'ASUS', name: 'ASUS Vivobook 15 (Core i3-1215U, 8GB, 512GB)', base: 49900, year: 2024, popularity: 78, summary: 'Budget pick for students', specs: { Processor: 'Intel Core i3-1215U', RAM: '8 GB', Storage: '512 GB SSD', Display: '15.6" FHD', Weight: '1.7 kg' } },
  { slug: 'apple-macbook-air-13-m4-16-256', category: 'laptops', brand: 'Apple', name: 'Apple MacBook Air 13" M4 (16GB, 256GB)', base: 149000, year: 2025, popularity: 88, summary: 'Fanless, 18-hour battery', specs: { Processor: 'Apple M4, 10-core CPU', RAM: '16 GB', Storage: '256 GB SSD', Display: '13.6" Liquid Retina', Weight: '1.24 kg' } },
  { slug: 'acer-aspire-lite-15-core-i5-1235u', category: 'laptops', brand: 'Acer', name: 'Acer Aspire Lite 15 (Core i5-1235U, 8GB, 512GB)', base: 58500, year: 2024, popularity: 61, summary: 'Metal body, upgradeable RAM', specs: { Processor: 'Intel Core i5-1235U', RAM: '8 GB', Storage: '512 GB SSD', Display: '15.6" FHD', Weight: '1.59 kg' } },
  { slug: 'walton-43-4k-google-tv', category: 'tvs', brand: 'Walton', name: 'Walton 43" 4K Google TV', base: 41900, year: 2025, popularity: 79, summary: 'Made in Bangladesh, Google TV', specs: { Screen: '43" 4K UHD', 'Smart system': 'Google TV', HDMI: '3 ports', Sound: '24 W' } },
  { slug: 'samsung-55-crystal-uhd-du7700', category: 'tvs', brand: 'Samsung', name: 'Samsung 55" Crystal UHD DU7700', base: 89900, year: 2024, popularity: 73, summary: '4K, Tizen, slim design', specs: { Screen: '55" 4K UHD', 'Smart system': 'Tizen', HDMI: '3 ports', Sound: '20 W' } },
  { slug: 'xiaomi-tv-a-43-2025', category: 'tvs', brand: 'Xiaomi', name: 'Xiaomi TV A 43 (2025)', base: 36500, year: 2025, popularity: 75, summary: 'FHD, Google TV, metal bezel', specs: { Screen: '43" FHD', 'Smart system': 'Google TV', HDMI: '2 ports', Sound: '20 W' } },
  { slug: 'gree-1-5-ton-inverter-split', category: 'acs', brand: 'Gree', name: 'Gree 1.5 Ton Inverter Split AC', base: 78900, year: 2025, popularity: 77, summary: 'Inverter, copper condenser', specs: { Capacity: '1.5 ton (18,000 BTU)', Type: 'Inverter split', Refrigerant: 'R32', Warranty: 'Compressor 10 years (brand terms)' } },
  { slug: 'walton-1-5-ton-inverter-split', category: 'acs', brand: 'Walton', name: 'Walton 1.5 Ton Inverter Split AC', base: 62900, year: 2025, popularity: 81, summary: 'Inverter, low-voltage start', specs: { Capacity: '1.5 ton (18,000 BTU)', Type: 'Inverter split', Refrigerant: 'R32' } },
  { slug: 'midea-1-ton-inverter-split', category: 'acs', brand: 'Midea', name: 'Midea 1 Ton Inverter Split AC', base: 52500, year: 2024, popularity: 60, summary: 'For rooms up to 120 sq ft', specs: { Capacity: '1 ton (12,000 BTU)', Type: 'Inverter split', Refrigerant: 'R32' } },
  { slug: 'walton-380l-frost-refrigerator', category: 'fridges', brand: 'Walton', name: 'Walton 380 L Frost Refrigerator', base: 58990, year: 2025, popularity: 72, summary: 'Large family size, frost type', specs: { Capacity: '380 L', Type: 'Frost, top freezer', Compressor: 'Inverter' } },
  { slug: 'samsung-305l-inverter-refrigerator', category: 'fridges', brand: 'Samsung', name: 'Samsung 305 L Inverter Refrigerator', base: 77900, year: 2024, popularity: 63, summary: 'No-frost, digital inverter', specs: { Capacity: '305 L', Type: 'No-frost, top freezer', Compressor: 'Digital inverter' } },
  { slug: 'sony-wh-1000xm5', category: 'audio', brand: 'Sony', name: 'Sony WH-1000XM5 headphones', base: 39900, year: 2022, popularity: 69, summary: 'Noise cancelling, 30 h battery', specs: { Type: 'Over-ear, wireless', 'Noise cancelling': 'Yes', Battery: '30 h' } },
  { slug: 'jbl-flip-6', category: 'audio', brand: 'JBL', name: 'JBL Flip 6 speaker', base: 12500, year: 2022, popularity: 71, summary: 'IP67 portable speaker', specs: { Type: 'Portable Bluetooth speaker', 'Water resistance': 'IP67', Battery: '12 h' } },
];

// Shops that must carry a product so community deals and product pages agree.
const FORCED_SHOPS: Record<string, string[]> = {
  'xiaomi-redmi-note-14-pro-8-256': ['padma-tech'],
  'walton-1-5-ton-inverter-split': ['meghna-digital'],
  'jbl-flip-6': ['meghna-digital'],
  'apple-macbook-air-13-m4-16-256': ['jamuna-gadget-point'],
  'samsung-galaxy-a16-6-128': ['surma-mobile-hub'],
  'xiaomi-tv-a-43-2025': ['karnaphuli-electronics'],
  'realme-c75-8-128': ['jamuna-gadget-point'],
  'samsung-305l-inverter-refrigerator': ['padma-tech'],
};

const METHODS: Array<[slug: string, kind: 'mfs' | 'card', name: string, issuer: string]> = [
  ['bkash', 'mfs', 'bKash', 'bKash Limited'],
  ['nagad', 'mfs', 'Nagad', 'Nagad'],
  ['rocket', 'mfs', 'Rocket', 'Dutch-Bangla Bank'],
  ['upay', 'mfs', 'Upay', 'UCB'],
  ['city-amex', 'card', 'City Bank American Express', 'The City Bank'],
  ['ebl-visa', 'card', 'EBL Visa credit card', 'Eastern Bank'],
  ['brac-visa', 'card', 'BRAC Bank Visa credit card', 'BRAC Bank'],
  ['dbbl-nexus', 'card', 'DBBL Nexus debit card', 'Dutch-Bangla Bank'],
  ['mastercard', 'card', 'Any Mastercard credit card', 'Mastercard'],
];

const OPERATORS: Array<[slug: string, name: string]> = [
  ['gp', 'Grameenphone'],
  ['robi', 'Robi'],
  ['banglalink', 'Banglalink'],
  ['airtel', 'Airtel'],
  ['teletalk', 'Teletalk'],
];

const OBSERVER_2026 = 'https://observerbd.com/news/586298';
const BONIK_BARTA = 'https://en.bonikbarta.com/business/2e37YHT3lHInytiq/';

// [operator, name, price, dataGB, minutes, validityDays|null, kind, source, checkedDaysAgo]
const PACKS: Array<[string, string, number, number, number, number | null, 'data' | 'voice' | 'combo', string, number]> = [
  ['gp', '1 GB, 7 days', 48, 1, 0, 7, 'data', OBSERVER_2026, 97],
  ['gp', '2 GB, 7 days', 69, 2, 0, 7, 'data', OBSERVER_2026, 97],
  ['gp', '40 GB, 7 days', 249, 40, 0, 7, 'data', BONIK_BARTA, 200],
  ['gp', '30 GB, 30 days', 498, 30, 0, 30, 'data', 'demo', 2],
  ['gp', '60 GB, 30 days', 699, 60, 0, 30, 'data', 'demo', 2],
  ['gp', '500 minutes, 30 days', 425, 0, 500, 30, 'voice', 'demo', 2],
  ['gp', '20 GB + 300 minutes, 30 days', 649, 20, 300, 30, 'combo', 'demo', 2],
  ['gp', '10 GB, no expiry', 449, 10, 0, null, 'data', 'demo', 2],
  ['robi', '1 GB, 7 days', 48, 1, 0, 7, 'data', 'demo', 1],
  ['robi', '8 GB, 7 days', 158, 8, 0, 7, 'data', 'demo', 1],
  ['robi', '25 GB, 30 days', 449, 25, 0, 30, 'data', 'demo', 1],
  ['robi', '40 GB, 30 days', 599, 40, 0, 30, 'data', 'demo', 1],
  ['robi', '300 minutes, 30 days', 279, 0, 300, 30, 'voice', 'demo', 1],
  ['robi', '15 GB + 250 minutes, 30 days', 549, 15, 250, 30, 'combo', 'demo', 1],
  ['banglalink', '2 GB, 7 days', 69, 2, 0, 7, 'data', 'demo', 3],
  ['banglalink', '12 GB, 7 days', 199, 12, 0, 7, 'data', 'demo', 3],
  ['banglalink', '30 GB, 30 days', 499, 30, 0, 30, 'data', 'demo', 3],
  ['banglalink', '400 minutes, 30 days', 349, 0, 400, 30, 'voice', 'demo', 3],
  ['banglalink', '25 GB + 500 minutes, 30 days', 699, 25, 500, 30, 'combo', 'demo', 3],
  ['airtel', '3 GB, 7 days', 98, 3, 0, 7, 'data', 'demo', 4],
  ['airtel', '20 GB, 30 days', 399, 20, 0, 30, 'data', 'demo', 4],
  ['airtel', '250 minutes, 30 days', 229, 0, 250, 30, 'voice', 'demo', 4],
  ['teletalk', '10 GB, 30 days', 198, 10, 0, 30, 'data', 'demo', 6],
  ['teletalk', '26 GB, no expiry', 309, 26, 0, null, 'data', 'demo', 6],
];

export function seedDemo(db: DatabaseSync, now: Date = new Date()): void {
  const r = rng(20261109);
  const today = todayDhaka(now);
  db.exec('BEGIN');
  try {
    const insCat = db.prepare('INSERT INTO categories (slug, name_bn, name_en, sort) VALUES (?, ?, ?, ?)');
    CATEGORIES.forEach(([slug, bn, en], i) => insCat.run(slug, bn, en, i));

    const insShop = db.prepare(
      'INSERT INTO shops (slug, name, city, cod, delivery_dhaka, delivery_outside, verified, is_demo) VALUES (?, ?, ?, ?, ?, ?, 0, 1)',
    );
    const shopIds = SHOPS.map((s) => Number(insShop.run(s.slug, s.name, s.city, s.cod, s.dhaka, s.outside).lastInsertRowid));

    const insProduct = db.prepare(
      'INSERT INTO products (slug, category, brand, name, summary, specs_json, release_year, popularity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    const insOffer = db.prepare(`INSERT INTO offers
      (product_id, shop_id, price, regular_price, in_stock, warranty_type, warranty_months, emi_months, url, checked_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'demo')`);
    const insPoint = db.prepare('INSERT OR REPLACE INTO price_points (product_id, shop_id, price, observed_on) VALUES (?, ?, ?, ?)');

    const productIds = new Map<string, number>();
    for (const p of PRODUCTS) {
      const productId = Number(
        insProduct.run(p.slug, p.category, p.brand, p.name, p.summary, JSON.stringify(p.specs), p.year, p.popularity).lastInsertRowid,
      );
      productIds.set(p.slug, productId);

      const shuffled = shopIds.map((id) => ({ id, k: r() })).sort((a, b) => a.k - b.k);
      const count = 3 + Math.floor(r() * 3);
      const forced = (FORCED_SHOPS[p.slug] ?? []).map((slug) => shopIds[SHOPS.findIndex((s) => s.slug === slug)]);
      const chosen = [...forced, ...shuffled.map((s) => s.id).filter((id) => !forced.includes(id))].slice(0, Math.max(count, forced.length));
      const candidates = chosen.filter((id) => !forced.includes(id));
      const unofficialShop = p.unofficial && candidates.length ? candidates[candidates.length - 1] : null;

      for (const shopId of chosen) {
        const isUnofficial = shopId === unofficialShop;
        const factor = isUnofficial ? 0.86 + r() * 0.05 : 0.96 + r() * 0.09;
        const price = shopRound(p.base * factor, r);
        const regular = r() < 0.4 ? shopRound(price * (1.05 + r() * 0.07), r) : null;
        const warranty = isUnofficial ? 'unofficial' : p.category === 'phones' || r() < 0.7 ? 'official' : 'shop';
        const warrantyMonths = warranty === 'unofficial' ? 0 : warranty === 'shop' ? 6 : p.category === 'acs' ? 24 : 12;
        const emi = price >= 15000 && !isUnofficial ? [0, 3, 6, 12][Math.floor(r() * 4)] : 0;
        const inStock = r() < 0.86 ? 1 : 0;
        insOffer.run(productId, shopId, price, regular, inStock, warranty, warrantyMonths, emi, hoursAgo(1 + Math.floor(r() * 30), now));

        // 90 days of history ending at today's price: a gentle walk with occasional promotions.
        let walk = price * (1.04 + r() * 0.07);
        const promoStart = 20 + Math.floor(r() * 50);
        for (let d = 89; d >= 0; d--) {
          const day = addDays(today, -d);
          if (d === 0) {
            insPoint.run(productId, shopId, price, day);
            continue;
          }
          walk += (price - walk) * 0.025 + (r() - 0.5) * price * 0.004;
          // Last week glides to today's price; one four-day promotion somewhere earlier.
          const level = d <= 7 ? price + (walk - price) * (d / 8) : walk;
          const promo = d <= promoStart && d > promoStart - 4 ? 0.96 : 1;
          insPoint.run(productId, shopId, Math.round((level * promo) / 50) * 50, day);
        }
      }
    }

    const insMethod = db.prepare('INSERT INTO payment_methods (slug, kind, name, issuer, sort) VALUES (?, ?, ?, ?, ?)');
    const methodIds = new Map<string, number>();
    METHODS.forEach(([slug, kind, name, issuer], i) => methodIds.set(slug, Number(insMethod.run(slug, kind, name, issuer, i).lastInsertRowid)));
    const shopId = (slug: string) => shopIds[SHOPS.findIndex((s) => s.slug === slug)];

    const insPayOffer = db.prepare(`INSERT INTO payment_offers
      (method_id, shop_id, category, percent, flat, cap, min_spend, kind, starts_on, ends_on, title_bn, title_en, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'demo')`);
    const payOffers: Array<[string, string | null, string | null, number, number, number | null, number, 'discount' | 'cashback', number, number, string, string]> = [
      ['bkash', 'bazaar24', null, 10, 0, 300, 1000, 'cashback', -10, 20, 'Bazaar24-এ bKash পেমেন্টে ১০% ক্যাশব্যাক, সর্বোচ্চ ৳৩০০', '10% bKash cashback at Bazaar24, up to ৳300'],
      ['bkash', 'padma-tech', 'phones', 5, 0, 1500, 10000, 'discount', -5, 25, 'Padma Tech-এ ফোন কিনলে bKash-এ ৫% ছাড়, সর্বোচ্চ ৳১,৫০০', '5% off phones with bKash at Padma Tech, up to ৳1,500'],
      ['nagad', 'meghna-digital', null, 12, 0, 450, 2000, 'cashback', -3, 2, 'Meghna Digital-এ Nagad-এ ১২% ক্যাশব্যাক, সর্বোচ্চ ৳৪৫০', '12% Nagad cashback at Meghna Digital, up to ৳450'],
      ['city-amex', 'jamuna-gadget-point', 'laptops', 10, 0, 5000, 30000, 'discount', -7, 30, 'Jamuna Gadget Point-এ ল্যাপটপে সিটি ব্যাংক অ্যামেক্সে ১০% ছাড়, সর্বোচ্চ ৳৫,০০০', '10% off laptops with City Bank Amex at Jamuna Gadget Point, up to ৳5,000'],
      ['ebl-visa', 'karnaphuli-electronics', null, 7, 0, 3000, 10000, 'discount', -2, 40, 'Karnaphuli Electronics-এ EBL Visa-য় ৭% ছাড়, সর্বোচ্চ ৳৩,০০০', '7% off with EBL Visa at Karnaphuli Electronics, up to ৳3,000'],
      ['brac-visa', 'padma-tech', null, 0, 1000, null, 40000, 'discount', -1, 15, 'Padma Tech-এ ৳৪০,০০০+ কেনাকাটায় BRAC Visa-য় ৳১,০০০ ছাড়', '৳1,000 off ৳40,000+ with BRAC Bank Visa at Padma Tech'],
      ['mastercard', 'bazaar24', null, 15, 0, 500, 0, 'discount', -4, 6, 'Bazaar24-এ Mastercard-এ ১৫% ছাড়, সর্বোচ্চ ৳৫০০', '15% off with Mastercard at Bazaar24, up to ৳500'],
      ['rocket', 'surma-mobile-hub', null, 8, 0, 250, 5000, 'cashback', -6, 24, 'Surma Mobile Hub-এ Rocket-এ ৮% ক্যাশব্যাক, সর্বোচ্চ ৳২৫০', '8% Rocket cashback at Surma Mobile Hub, up to ৳250'],
      ['dbbl-nexus', 'meghna-digital', 'audio', 5, 0, 800, 3000, 'discount', -8, 22, 'Meghna Digital-এ হেডফোন-স্পিকারে DBBL Nexus-এ ৫% ছাড়', '5% off audio with DBBL Nexus at Meghna Digital, up to ৳800'],
      ['upay', 'bazaar24', 'food', 10, 0, 200, 800, 'cashback', -2, 12, 'Bazaar24 গ্রোসারিতে Upay-এ ১০% ক্যাশব্যাক, সর্বোচ্চ ৳২০০', '10% Upay cashback on Bazaar24 groceries, up to ৳200'],
      ['nagad', 'padma-tech', null, 10, 0, 1000, 5000, 'cashback', -30, -1, 'মেয়াদ শেষ: Padma Tech-এ Nagad ক্যাশব্যাক', 'Ended: Nagad cashback at Padma Tech'],
    ];
    for (const [m, s, cat, percent, flat, cap, min, kind, from, to, bn, en] of payOffers) {
      insPayOffer.run(methodIds.get(m)!, s ? shopId(s) : null, cat, percent, flat, cap, min, kind, addDays(today, from), addDays(today, to), bn, en);
    }

    const insOperator = db.prepare('INSERT INTO operators (slug, name, sort) VALUES (?, ?, ?)');
    OPERATORS.forEach(([slug, name], i) => insOperator.run(slug, name, i));
    const insPack = db.prepare(
      'INSERT INTO packs (operator, name, price, data_mb, minutes, validity_days, kind, dial_code, checked_at, source) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)',
    );
    for (const [op, name, price, gb, minutes, validity, kind, source, ago] of PACKS) {
      insPack.run(op, name, price, gb * 1024, minutes, validity, kind, hoursAgo(ago * 24, now), source);
    }

    // People. Voter accounts exist only so demo temperatures look like a live community.
    const insUser = db.prepare(
      'INSERT INTO users (email, password_hash, name, role, approved_deals, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    const demoHash = hashPasswordSync(DEMO_PASSWORD);
    const consent = hoursAgo(24 * 40, now);
    const admin = Number(insUser.run(DEMO_ADMIN_EMAIL, demoHash, 'SaveSmart team', 'admin', 0, consent, consent).lastInsertRowid);
    const members = [
      ['rafi@savesmart.local', 'Rafi', 5],
      ['nusrat@savesmart.local', 'Nusrat', 7],
      ['tanvir@savesmart.local', 'Tanvir', 4],
      ['mitu@savesmart.local', 'Mitu', 0],
    ].map(([email, name, approved]) => Number(insUser.run(email, demoHash, name, 'member', approved, consent, consent).lastInsertRowid));
    const [rafi, nusrat, tanvir, mitu] = members;
    const locked = 'locked$demo-voter';
    const voters: number[] = [];
    for (let i = 1; i <= 90; i++) {
      voters.push(Number(insUser.run(`voter${i}@demo.savesmart.local`, locked, `Member ${i}`, 'member', 0, consent, consent).lastInsertRowid));
    }

    const insDeal = db.prepare(`INSERT INTO deals
      (user_id, title, body, category, shop_name, url, price, regular_price, voucher_code, method_id, product_id, expires_on, status, created_at)
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insVote = db.prepare('INSERT INTO deal_votes (deal_id, user_id, value, created_at) VALUES (?, ?, ?, ?)');
    const insComment = db.prepare('INSERT INTO comments (deal_id, user_id, body, created_at) VALUES (?, ?, ?, ?)');
    const setDealStats = db.prepare('UPDATE deals SET temperature = ?, comment_count = ? WHERE id = ?');

    type DealSeed = {
      by: number; title: string; body: string; cat: string; shop: string; price: number | null; regular: number | null;
      code?: string; method?: string; product?: string; expiresIn?: number | null; status: 'published' | 'pending' | 'expired';
      hoursAgo: number; hot: number; cold: number; comments: Array<[number, string, number]>;
    };
    const deals: DealSeed[] = [
      { by: rafi, title: 'Redmi Note 14 Pro 8/256 around ৳31,500 at Padma Tech with bKash', body: 'Official warranty. The 5% bKash discount (up to ৳1,500) comes off at checkout. I checked the box in store: BTRC-registered IMEI.', cat: 'phones', shop: 'Padma Tech', price: 31499, regular: 33999, method: 'bkash', product: 'xiaomi-redmi-note-14-pro-8-256', expiresIn: 9, status: 'published', hoursAgo: 5, hot: 66, cold: 4, comments: [[nusrat, 'অফিসিয়াল ওয়ারেন্টি কিনা দোকানে ফোন করে নিশ্চিত হয়েছি, অফিসিয়াল।', 4], [tanvir, 'Same phone unofficial is ৳29k but no warranty and NEIR risk. This is the better buy.', 3]] },
      { by: nusrat, title: 'Walton 1.5 ton inverter AC: ৳4,000 off before winter', body: 'Pre-winter clearance at Meghna Digital. Installation in Dhaka is included; outside Dhaka the shop charges extra.', cat: 'acs', shop: 'Meghna Digital', price: 58900, regular: 62900, product: 'walton-1-5-ton-inverter-split', expiresIn: 12, status: 'published', hoursAgo: 20, hot: 48, cold: 6, comments: [[mitu, 'ইনস্টলেশন ফ্রি শুধু ঢাকার ভেতরে, চট্টগ্রামে ৳১,৫০০ চার্জ।', 15]] },
      { by: tanvir, title: 'Bazaar24: ৳150 off groceries over ৳1,500 with code', body: 'Works on rice, oil and lentils. One use per account. Stack it with the Upay cashback for groceries.', cat: 'food', shop: 'Bazaar24', price: null, regular: null, code: 'DEMO150', expiresIn: 3, status: 'published', hoursAgo: 9, hot: 41, cold: 2, comments: [[rafi, 'Upay cashback-ও পেয়েছি, দুটো একসাথে কাজ করে।', 6]] },
      { by: rafi, title: 'JBL Flip 6 at ৳10,990, lowest in 90 days', body: 'Price history on SaveSmart shows it never went below ৳11,400 in the last three months.', cat: 'audio', shop: 'Meghna Digital', price: 10990, regular: 12500, product: 'jbl-flip-6', expiresIn: null, status: 'published', hoursAgo: 30, hot: 34, cold: 3, comments: [] },
      { by: nusrat, title: 'Nagad 12% cashback at Meghna Digital, up to ৳450', body: 'Minimum spend ৳2,000. Cashback lands in your Nagad wallet within 7 working days. Ends soon.', cat: 'phones', shop: 'Meghna Digital', price: null, regular: null, method: 'nagad', expiresIn: 2, status: 'published', hoursAgo: 14, hot: 39, cold: 5, comments: [[tanvir, 'Last time it took 5 days to arrive. Worked fine.', 10]] },
      { by: tanvir, title: 'MacBook Air M4: ৳5,000 off with City Bank Amex at Jamuna Gadget Point', body: 'Official Apple warranty. The Amex discount is capped at ৳5,000, which you hit at this price.', cat: 'laptops', shop: 'Jamuna Gadget Point', price: 141500, regular: 149000, method: 'city-amex', product: 'apple-macbook-air-13-m4-16-256', expiresIn: 30, status: 'published', hoursAgo: 52, hot: 57, cold: 9, comments: [[rafi, 'EMI ৬ মাস ০% আছে কিনা জিজ্ঞেস করেছিলাম, আছে।', 40]] },
      { by: rafi, title: 'Galaxy A16 is ৳1,000 cheaper than last week at Surma Mobile Hub', body: 'Official warranty, no COD from this shop. Delivery to Dhaka takes 2 days.', cat: 'phones', shop: 'Surma Mobile Hub', price: 19999, regular: 20999, product: 'samsung-galaxy-a16-6-128', expiresIn: null, status: 'published', hoursAgo: 70, hot: 22, cold: 6, comments: [] },
      { by: nusrat, title: 'Dhaka to Cox’s Bazar AC bus: 10% off on weekdays', body: 'Sunday to Wednesday departures only. Book at least 2 days ahead.', cat: 'travel', shop: 'Bazaar24', price: null, regular: null, code: 'DEMOBUS10', expiresIn: 20, status: 'published', hoursAgo: 26, hot: 29, cold: 1, comments: [] },
      { by: tanvir, title: 'Eid collection: 30% off panjabi at Bazaar24', body: 'Discount shown on the product page. Sizes M and L sell out first.', cat: 'fashion', shop: 'Bazaar24', price: null, regular: null, expiresIn: 6, status: 'published', hoursAgo: 40, hot: 18, cold: 4, comments: [] },
      { by: rafi, title: 'Xiaomi TV A 43 (2025) at ৳35,900 with free wall mount', body: 'Same price as last month, the wall mount is the only extra.', cat: 'tvs', shop: 'Karnaphuli Electronics', price: 35900, regular: 36500, product: 'xiaomi-tv-a-43-2025', expiresIn: null, status: 'published', hoursAgo: 60, hot: 6, cold: 14, comments: [[nusrat, 'এটা আসলে ডিল না, গত মাসেও একই দাম ছিল।', 50]] },
      { by: nusrat, title: 'Robi 40 GB, 30 days for ৳599 in the app', body: 'Shows under "Internet offers" in the Robi app. Check your own app: offers differ by number.', cat: 'telecom', shop: 'Robi', price: 599, regular: null, expiresIn: 10, status: 'published', hoursAgo: 3, hot: 15, cold: 2, comments: [] },
      { by: mitu, title: 'Realme C75 bundle with free earbuds', body: 'Bundle only on the website, not in the store.', cat: 'phones', shop: 'Jamuna Gadget Point', price: 19499, regular: null, product: 'realme-c75-8-128', expiresIn: 14, status: 'pending', hoursAgo: 1, hot: 0, cold: 0, comments: [] },
      { by: tanvir, title: 'Samsung 305 L fridge: Pohela Boishakh price', body: 'Festival price, now over.', cat: 'fridges', shop: 'Padma Tech', price: 72900, regular: 77900, product: 'samsung-305l-inverter-refrigerator', expiresIn: -3, status: 'expired', hoursAgo: 24 * 12, hot: 44, cold: 3, comments: [] },
    ];

    for (const d of deals) {
      const created = hoursAgo(d.hoursAgo, now);
      const dealId = Number(
        insDeal.run(
          d.by, d.title, d.body, d.cat, d.shop, d.price, d.regular, d.code ?? null,
          d.method ? methodIds.get(d.method)! : null,
          d.product ? productIds.get(d.product)! : null,
          d.expiresIn == null ? null : addDays(today, d.expiresIn),
          d.status, created,
        ).lastInsertRowid,
      );
      const pool = [...voters].sort(() => r() - 0.5);
      let i = 0;
      for (let h = 0; h < d.hot; h++) insVote.run(dealId, pool[i++], 1, created);
      for (let c = 0; c < d.cold; c++) insVote.run(dealId, pool[i++], -1, created);
      for (const [uid, body, hAgo] of d.comments) insComment.run(dealId, uid, body, hoursAgo(Math.min(hAgo, d.hoursAgo), now));
      setDealStats.run(temperatureFromVotes(d.hot, d.cold), d.comments.length, dealId);
    }

    // Rafi's setup: wallets, one alert, one notification.
    const insUserMethod = db.prepare('INSERT INTO user_methods (user_id, method_id) VALUES (?, ?)');
    insUserMethod.run(rafi, methodIds.get('bkash')!);
    insUserMethod.run(rafi, methodIds.get('brac-visa')!);
    db.prepare('INSERT INTO price_alerts (user_id, product_id, target_price) VALUES (?, ?, ?)').run(
      rafi, productIds.get('samsung-galaxy-a56-5g-8-256')!, 48000,
    );
    db.prepare('INSERT INTO notifications (user_id, kind, body_bn, body_en, link, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      rafi, 'welcome',
      'SaveSmart-এ স্বাগতম। আপনার bKash ও BRAC Visa অফার এখন সব দামে ধরা হচ্ছে।',
      'Welcome to SaveSmart. Your bKash and BRAC Visa offers are now included in every price.',
      '/offers', hoursAgo(30, now),
    );
    void admin;

    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('demo_seeded', ?)").run(now.toISOString());
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
