// Creates a moderator account, or promotes an existing one.
// Usage: npm run create-admin -- <email> <name> <password>
import { defaultDbPath, openDb } from '../src/lib/db.ts';
import { hashPasswordSync } from '../src/lib/password.ts';

const [email, name, password] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !password || password.length < 12) {
  console.error('Usage: npm run create-admin -- <email> <name> <password of 12+ characters>');
  process.exit(1);
}

const db = openDb(defaultDbPath());
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as { id: number } | undefined;
if (existing) {
  db.prepare("UPDATE users SET role = 'admin', name = ?, password_hash = ? WHERE id = ?").run(name, hashPasswordSync(password), existing.id);
  console.log(`Promoted ${email} to moderator.`);
} else {
  db.prepare("INSERT INTO users (email, name, password_hash, role, consent_at) VALUES (?, ?, ?, 'admin', datetime('now'))").run(
    email.toLowerCase(), name, hashPasswordSync(password),
  );
  console.log(`Created moderator ${email} in ${defaultDbPath()}.`);
}
