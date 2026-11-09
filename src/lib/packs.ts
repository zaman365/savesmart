// Mobile pack ranking by real monthly cost for a shopper's usage.

export interface Pack {
  id: number;
  operator: string;
  name: string;
  price: number;
  dataMb: number;
  minutes: number;
  validityDays: number | null;
  kind: 'data' | 'voice' | 'combo';
}

export interface Usage {
  dataGb: number;
  minutes: number;
}

export interface PackResult {
  pack: Pack;
  packsNeeded: number;
  monthlyCost: number;
  costPerGb: number | null;
  unusedGb: number;
}

const DAYS = 30;

export function packsNeeded(pack: Pack, usage: Usage): number {
  const needMb = Math.max(0, usage.dataGb) * 1024;
  const byValidity = pack.validityDays ? Math.ceil(DAYS / pack.validityDays) : 1;
  const byData = needMb > 0 && pack.dataMb > 0 ? Math.ceil(needMb / pack.dataMb) : 0;
  const byMinutes = usage.minutes > 0 && pack.minutes > 0 ? Math.ceil(usage.minutes / pack.minutes) : 0;
  return Math.max(byValidity, byData, byMinutes, 1);
}

/** Does the pack cover every kind of use asked for? */
export function coversUsage(pack: Pack, usage: Usage): boolean {
  if (usage.dataGb > 0 && pack.dataMb === 0) return false;
  if (usage.minutes > 0 && pack.minutes === 0) return false;
  return true;
}

export function evaluatePack(pack: Pack, usage: Usage): PackResult {
  const count = packsNeeded(pack, usage);
  const needMb = Math.max(0, usage.dataGb) * 1024;
  return {
    pack,
    packsNeeded: count,
    monthlyCost: count * pack.price,
    costPerGb: pack.dataMb > 0 ? pack.price / (pack.dataMb / 1024) : null,
    unusedGb: pack.dataMb > 0 ? Math.max(0, count * pack.dataMb - needMb) / 1024 : 0,
  };
}

function byCost(a: PackResult, b: PackResult): number {
  return a.monthlyCost - b.monthlyCost || a.unusedGb - b.unusedGb || a.packsNeeded - b.packsNeeded;
}

/** Packs that cover the whole usage, cheapest first, and packs that cover only part of it. */
export function rankPacks(packs: readonly Pack[], usage: Usage): { full: PackResult[]; partial: PackResult[] } {
  const full: PackResult[] = [];
  const partial: PackResult[] = [];
  for (const pack of packs) {
    const result = evaluatePack(pack, usage);
    if (coversUsage(pack, usage)) full.push(result);
    else if ((usage.dataGb > 0 && pack.dataMb > 0) || (usage.minutes > 0 && pack.minutes > 0)) partial.push(result);
  }
  full.sort(byCost);
  partial.sort(byCost);
  return { full, partial };
}
