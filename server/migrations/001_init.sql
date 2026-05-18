-- ─────────────────────────────────────────────────────────────────────────────
-- Saffron & Co — initial Postgres schema (migrated from lowdb)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admins (
  id              SERIAL PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id                SERIAL PRIMARY KEY,
  phone_digits      TEXT UNIQUE NOT NULL,    -- raw digits, e.g. "923001234567"
  name              TEXT,
  phone             TEXT,
  city              TEXT,
  address           TEXT,
  total_orders      INTEGER NOT NULL DEFAULT 0,
  total_spent       INTEGER NOT NULL DEFAULT 0,
  first_order_at    TIMESTAMPTZ,
  last_order_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
  order_number       TEXT PRIMARY KEY,         -- SC-2026-NNNN
  status             TEXT NOT NULL,
  customer           JSONB NOT NULL,           -- { name, phone, city, address }
  items              JSONB NOT NULL,           -- [{ id, name, price, quantity, ... }]
  payment            TEXT NOT NULL,            -- 'cod' | 'easypaisa'
  easy_tid           TEXT,
  subtotal           INTEGER NOT NULL,
  delivery           INTEGER NOT NULL DEFAULT 0,
  total              INTEGER NOT NULL,
  tracking           JSONB,                    -- { carrier, trackingNumber, ... } | NULL
  notes              TEXT,
  payment_proof      JSONB,                    -- { filename, originalName, size, ... }
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders (created_at DESC);
-- For phone-based lookup we extract from JSONB. Functional index on normalized phone:
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders ((customer->>'phone'));

CREATE TABLE IF NOT EXISTS reviews (
  id              TEXT PRIMARY KEY,            -- rev_<ts>_<rand>
  product_id      TEXT NOT NULL,
  order_number    TEXT REFERENCES orders(order_number) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,               -- normalized form
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT,
  comment         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews (product_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_phone_product  ON reviews (customer_phone, product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at     ON reviews (created_at DESC);

CREATE TABLE IF NOT EXISTS stock (
  product_id   TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_overrides (
  product_id    TEXT PRIMARY KEY,
  data          JSONB NOT NULL,                -- { disabled?, price?, stock?, badge?, note?, ... }
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counters (
  key      TEXT PRIMARY KEY,
  value    JSONB NOT NULL
);
