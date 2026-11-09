import type { DB } from '../db.ts';
import type { Pack } from '../packs.ts';

type Row = Record<string, unknown>;

export interface Operator {
  slug: string;
  name: string;
}

export interface PackListing extends Pack {
  operatorName: string;
  dialCode: string | null;
  checkedAt: string;
  source: string;
}

export function listOperators(db: DB): Operator[] {
  return (db.prepare('SELECT slug, name FROM operators ORDER BY sort').all() as Row[]).map((r) => ({ slug: String(r.slug), name: String(r.name) }));
}

export function listPacks(db: DB, operator?: string): PackListing[] {
  const rows = (
    operator
      ? db.prepare('SELECT p.*, o.name AS operator_name FROM packs p JOIN operators o ON o.slug = p.operator WHERE p.operator = ?').all(operator)
      : db.prepare('SELECT p.*, o.name AS operator_name FROM packs p JOIN operators o ON o.slug = p.operator').all()
  ) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    operator: String(r.operator),
    operatorName: String(r.operator_name),
    name: String(r.name),
    price: Number(r.price),
    dataMb: Number(r.data_mb),
    minutes: Number(r.minutes),
    validityDays: r.validity_days == null ? null : Number(r.validity_days),
    kind: r.kind as Pack['kind'],
    dialCode: r.dial_code == null ? null : String(r.dial_code),
    checkedAt: String(r.checked_at),
    source: String(r.source),
  }));
}

export function searchPacks(db: DB, query: string): PackListing[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return listPacks(db).filter((p) => `${p.operatorName} ${p.name}`.toLowerCase().includes(q)).slice(0, 8);
}
