import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { MIGRATIONS } from './schema.ts';
import { seedDemo } from './seed.ts';

export type DB = DatabaseSync;

/** Demo mode seeds illustrative data and shows a banner. It always uses its own database file. */
export function isDemo(): boolean {
  return process.env.SAVESMART_DEMO === '1';
}

export function defaultDbPath(): string {
  if (process.env.SAVESMART_DB) return resolve(process.env.SAVESMART_DB);
  return resolve(process.cwd(), 'data', isDemo() ? 'demo.db' : 'savesmart.db');
}

export function migrate(db: DB): void {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  let version = row.user_version;
  while (version < MIGRATIONS.length) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[version]);
      version += 1;
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

export function openDb(path: string, options: { demo?: boolean } = {}): DB {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  if (path !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA busy_timeout = 5000');
  }
  migrate(db);
  if (options.demo) {
    const seeded = db.prepare("SELECT value FROM meta WHERE key = 'demo_seeded'").get();
    const hasData = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number };
    if (!seeded && hasData.n === 0) seedDemo(db);
  }
  return db;
}

const cache = globalThis as unknown as { __savesmartDb?: DB };

/** The shared connection for the running server. */
export function getDb(): DB {
  if (!cache.__savesmartDb) {
    cache.__savesmartDb = openDb(defaultDbPath(), { demo: isDemo() });
  }
  return cache.__savesmartDb;
}

/** Runs fn inside a transaction and returns its result. */
export function tx<T>(db: DB, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
