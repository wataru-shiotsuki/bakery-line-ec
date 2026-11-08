CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount integer NOT NULL CHECK (amount >= 50),
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  amount integer NOT NULL CHECK (amount >= 50),
  pickup_date date NOT NULL,
  qr_token uuid NOT NULL UNIQUE,
  stripe_payment_intent_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'picked_up')),
  created_at timestamptz NOT NULL DEFAULT now(),
  picked_up_at timestamptz
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
