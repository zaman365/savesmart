// Database schema. Each entry is one migration; the index + 1 is stored in PRAGMA user_version.
// Never edit a migration that has shipped; append a new one.

export const MIGRATIONS: string[] = [
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    approved_deals INTEGER NOT NULL DEFAULT 0,
    consent_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE categories (
    slug TEXT PRIMARY KEY,
    name_bn TEXT NOT NULL,
    name_en TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE shops (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    website TEXT,
    cod INTEGER NOT NULL DEFAULT 1,
    delivery_dhaka INTEGER NOT NULL DEFAULT 60,
    delivery_outside INTEGER NOT NULL DEFAULT 120,
    verified INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL REFERENCES categories(slug),
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    specs_json TEXT NOT NULL DEFAULT '{}',
    release_year INTEGER,
    popularity INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX products_category ON products(category);

  CREATE TABLE offers (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    price INTEGER NOT NULL CHECK (price > 0),
    regular_price INTEGER,
    in_stock INTEGER NOT NULL DEFAULT 1,
    warranty_type TEXT NOT NULL CHECK (warranty_type IN ('official', 'unofficial', 'shop')),
    warranty_months INTEGER NOT NULL DEFAULT 0,
    emi_months INTEGER NOT NULL DEFAULT 0,
    url TEXT,
    checked_at TEXT NOT NULL,
    source TEXT NOT NULL,
    UNIQUE (product_id, shop_id, warranty_type)
  );
  CREATE INDEX offers_product ON offers(product_id);

  CREATE TABLE price_points (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    observed_on TEXT NOT NULL,
    PRIMARY KEY (product_id, shop_id, observed_on)
  );

  CREATE TABLE payment_methods (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL CHECK (kind IN ('mfs', 'card')),
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE payment_offers (
    id INTEGER PRIMARY KEY,
    method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    category TEXT REFERENCES categories(slug),
    percent REAL NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
    flat INTEGER NOT NULL DEFAULT 0 CHECK (flat >= 0),
    cap INTEGER,
    min_spend INTEGER NOT NULL DEFAULT 0,
    kind TEXT NOT NULL CHECK (kind IN ('discount', 'cashback')),
    starts_on TEXT NOT NULL,
    ends_on TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    title_en TEXT NOT NULL,
    source TEXT NOT NULL
  );

  CREATE TABLE user_methods (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, method_id)
  );

  CREATE TABLE deals (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    category TEXT REFERENCES categories(slug),
    shop_name TEXT NOT NULL,
    url TEXT,
    price INTEGER,
    regular_price INTEGER,
    voucher_code TEXT,
    method_id INTEGER REFERENCES payment_methods(id),
    product_id INTEGER REFERENCES products(id),
    expires_on TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'expired')),
    temperature INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX deals_status_created ON deals(status, created_at);

  CREATE TABLE deal_votes (
    deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (deal_id, user_id)
  );

  CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX comments_deal ON comments(deal_id, created_at);

  CREATE TABLE operators (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE packs (
    id INTEGER PRIMARY KEY,
    operator TEXT NOT NULL REFERENCES operators(slug),
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    data_mb INTEGER NOT NULL DEFAULT 0,
    minutes INTEGER NOT NULL DEFAULT 0,
    validity_days INTEGER,
    kind TEXT NOT NULL CHECK (kind IN ('data', 'voice', 'combo')),
    dial_code TEXT,
    checked_at TEXT NOT NULL,
    source TEXT NOT NULL
  );

  CREATE TABLE price_alerts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_price INTEGER NOT NULL CHECK (target_price > 0),
    active INTEGER NOT NULL DEFAULT 1,
    last_triggered_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, product_id)
  );

  CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    body_bn TEXT NOT NULL,
    body_en TEXT NOT NULL,
    link TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX notifications_user ON notifications(user_id, created_at);

  CREATE TABLE meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];
