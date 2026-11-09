import type { DB } from '../db.ts';
import { tx } from '../db.ts';
import { hashToken, newSessionToken } from '../password.ts';

type Row = Record<string, unknown>;

export const SESSION_DAYS = 30;

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'member' | 'admin';
  approvedDeals: number;
  passwordHash: string;
}

function mapUser(r: Row): User {
  return {
    id: Number(r.id),
    email: String(r.email),
    name: String(r.name),
    role: r.role as User['role'],
    approvedDeals: Number(r.approved_deals),
    passwordHash: String(r.password_hash),
  };
}

export function findUserByEmail(db: DB, email: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim()) as Row | undefined;
  return row ? mapUser(row) : null;
}

export function getUser(db: DB, id: number): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row | undefined;
  return row ? mapUser(row) : null;
}

export function createUser(db: DB, input: { email: string; name: string; passwordHash: string; role?: User['role'] }): number {
  const result = db
    .prepare("INSERT INTO users (email, name, password_hash, role, consent_at) VALUES (?, ?, ?, ?, datetime('now'))")
    .run(input.email.trim(), input.name.trim(), input.passwordHash, input.role ?? 'member');
  return Number(result.lastInsertRowid);
}

/** Creates a session and returns the raw token for the cookie. Only its hash is stored. */
export function createSession(db: DB, userId: number): string {
  const token = newSessionToken();
  db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`).run(
    hashToken(token),
    userId,
  );
  return token;
}

export function userForSession(db: DB, token: string): User | null {
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    )
    .get(hashToken(token)) as Row | undefined;
  return row ? mapUser(row) : null;
}

export function deleteSession(db: DB, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function purgeExpiredSessions(db: DB): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}

export function getUserMethodIds(db: DB, userId: number): number[] {
  return (db.prepare('SELECT method_id FROM user_methods WHERE user_id = ?').all(userId) as Row[]).map((r) => Number(r.method_id));
}

export function setUserMethods(db: DB, userId: number, methodIds: number[]): void {
  tx(db, () => {
    db.prepare('DELETE FROM user_methods WHERE user_id = ?').run(userId);
    const insert = db.prepare('INSERT OR IGNORE INTO user_methods (user_id, method_id) SELECT ?, id FROM payment_methods WHERE id = ?');
    for (const id of methodIds) insert.run(userId, id);
  });
}
