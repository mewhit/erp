CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  first_name varchar(255),
  last_name varchar(255),
  display_name varchar(255),
  is_email_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS authentications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_hash varchar(255) NOT NULL,
  password_updated_at timestamp NOT NULL DEFAULT now(),
  is_email_verified boolean NOT NULL DEFAULT false,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamp,
  last_login_at timestamp,
  refresh_token_hash varchar(255),
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  code varchar(255) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  sku varchar(255) NOT NULL UNIQUE,
  description varchar(1000),
  unit_price_cents integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT organization_user_roles_org_id_user_id_role_id_unique UNIQUE (organization_id, user_id, role_id)
);

CREATE INDEX IF NOT EXISTS organization_user_roles_organization_id_index ON organization_user_roles(organization_id);
CREATE INDEX IF NOT EXISTS organization_user_roles_user_id_index ON organization_user_roles(user_id);
CREATE INDEX IF NOT EXISTS organization_user_roles_role_id_index ON organization_user_roles(role_id);

INSERT INTO organizations (name, slug, created_at, updated_at)
VALUES
  ('Mewhit', 'MEWHIT', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roles (name, code, created_at, updated_at)
VALUES
  ('Admin', 'ADMIN', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('Customer', 'CUSTOMER', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (display_name, email, created_at, updated_at)
VALUES
  ('Mike', 'mikewhittom27@gmail.com', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
ON CONFLICT (email) DO NOTHING;

INSERT INTO authentications (user_id, password_hash, created_at, updated_at)
SELECT
  id,
  'pbkdf2_sha256$310000$zp2jzRjb_UPSvW95T6YYmA$WbVRlXlMxBSkW7yjODOTc1yddxkwM3nUevdOX1cDvqY',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
FROM users
WHERE email = 'mikewhittom27@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    updated_at = EXCLUDED.updated_at;
