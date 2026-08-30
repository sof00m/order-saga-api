const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, 'orders.db'));

// WAL mode = better performance for concurrent reads
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    items      TEXT NOT NULL,         -- JSON string: [{ name, qty, price }]
    status     TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saga_steps (
    id             TEXT PRIMARY KEY,
    order_id       TEXT NOT NULL,
    step_name      TEXT NOT NULL,     -- 'payment' | 'inventory' | 'shipping'
    status         TEXT NOT NULL,     -- 'COMPLETED' | 'COMPENSATED'
    executed_at    TEXT,
    compensated_at TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    url        TEXT NOT NULL,
    events     TEXT NOT NULL,        -- JSON array: ["order.payment_completed", ...]
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id              TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    order_id        TEXT NOT NULL,
    event           TEXT NOT NULL,
    payload         TEXT NOT NULL,    -- JSON string
    status          TEXT NOT NULL DEFAULT 'PENDING',  -- 'PENDING' | 'DELIVERED' | 'FAILED'
    attempts        INTEGER DEFAULT 0,
    next_retry_at   TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subscription_id) REFERENCES webhook_subscriptions(id)
  );
`);

module.exports = db;