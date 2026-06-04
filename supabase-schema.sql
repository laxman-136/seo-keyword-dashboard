-- Supabase Schema for SEO Keyword Dashboard
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'ceo', 'user')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Viewer access grants for shared dashboard sources
CREATE TABLE IF NOT EXISTS access_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sheet_id VARCHAR(255), -- Nullable for legacy compatibility
  seo_sheet_id VARCHAR(255),
  leads_sheet_id VARCHAR(255),
  revenue_sheet_id VARCHAR(255),
  api_key VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_grants_recipient_email ON access_grants(recipient_email);
CREATE INDEX IF NOT EXISTS idx_access_grants_owner_email ON access_grants(owner_email);
CREATE INDEX IF NOT EXISTS idx_access_grants_sheet_id ON access_grants(sheet_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_expires_at ON access_grants(expires_at);

-- Example test grant (idempotent) for local testing
INSERT INTO access_grants (id, recipient_email, owner_email, label, sheet_id, api_key, expires_at, created_at)
SELECT '00000000-0000-4000-8000-000000000001'::uuid, 'client@example.com', 'veerasubramanyam.aki@techleadsit.com', 'Demo Client', 'DEMO_SHEET_123', 'DEMO_KEY', '2027-01-01T00:00:00Z', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM access_grants WHERE recipient_email = 'client@example.com' AND sheet_id = 'DEMO_SHEET_123'
);

-- Insert existing users from the dashboard (idempotent)
INSERT INTO users (email, name, password_hash, role, status, created_at, approved_at, approved_by)
VALUES 
  ('laxmansubramanyam@gmail.com', 'Laxman Subramanyam', '4c08ba31b5f95c3472e6fc16d1600b21:7e9aa3bc9b5569b2e174d25b8cf069a9963b976449ddfbcf32bf5a8b065a1858704e4e1bae83a0599ef40c3fa421684d815f884305e9add74739c2cff0bbc5f3', 'superadmin', 'approved', '2026-05-31 11:51:57.848', '2026-05-31 11:51:57.848', 'system'),
  ('veerasubramanyam.aki@techleadsit.com', 'Veerasubramanyam AKI', '4c08ba31b5f95c3472e6fc16d1600b21:7e9aa3bc9b5569b2e174d25b8cf069a9963b976449ddfbcf32bf5a8b065a1858704e4e1bae83a0599ef40c3fa421684d815f884305e9add74739c2cff0bbc5f3', 'admin', 'approved', '2026-05-31 11:51:57.855', '2026-05-31 11:51:57.855', 'system'),
  ('akilakshman89@gmail.com', 'Lakshman', 'cabdd78981bbae62cfd811ecb2b9a6c9:a2c491fe8a9ed7256217d733f017bb649cfd03cd4066749c190f5eb03e3390cd9eac3d09c4781332153a4adef5ab64b39db2195f5dee5080c90afc99bc84136c', 'user', 'approved', '2026-05-31 12:00:40.849', '2026-05-31 12:01:42.901', 'veerasubramanyam.aki@techleadsit.com')
ON CONFLICT (email) DO NOTHING;

-- Optional: Set RLS (Row Level Security) - uncomment if you want to use Supabase auth
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);

-- ── MIGRATIONS FOR EXISTING TABLES ───────────────────────────────────────────
-- If you are updating an existing database, run these commands to add the new columns
-- and modify constraints without dropping the table.
ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS seo_sheet_id VARCHAR(255);
ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS leads_sheet_id VARCHAR(255);
ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS revenue_sheet_id VARCHAR(255);
ALTER TABLE access_grants ALTER COLUMN sheet_id DROP NOT NULL;
