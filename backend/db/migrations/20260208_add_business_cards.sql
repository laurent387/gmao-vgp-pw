CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT '',
  company_logo_url TEXT,
  website_url TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  legal_name TEXT,
  siret TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO company_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_business_card (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  job_title TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  is_email_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_public BOOLEAN NOT NULL DEFAULT FALSE,
  public_token TEXT UNIQUE,
  public_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_business_card_public_token_idx
  ON user_business_card (public_token);
