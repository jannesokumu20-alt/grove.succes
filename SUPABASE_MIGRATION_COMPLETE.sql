-- ============================================
-- GROVE - COMPLETE DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX MEMBERS TABLE
-- ============================================

-- Add missing columns to members if they don't exist
ALTER TABLE members
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

ALTER TABLE members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set default values for any existing NULL full_name
UPDATE members SET full_name = 'Member' WHERE full_name IS NULL OR full_name = '';

-- Make full_name NOT NULL
ALTER TABLE members 
ALTER COLUMN full_name SET NOT NULL;

-- ============================================
-- 2. FIX CONTRIBUTIONS TABLE
-- ============================================

-- Add missing columns
ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS note TEXT DEFAULT NULL;

ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS recorded_by UUID;

ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set recorded_by for existing records (system default)
UPDATE contributions 
SET recorded_by = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE recorded_by IS NULL;

-- Make recorded_by NOT NULL
ALTER TABLE contributions
ALTER COLUMN recorded_by SET NOT NULL;

-- ============================================
-- 3. FIX UNIQUE CONSTRAINT ON CONTRIBUTIONS
-- ============================================

-- Drop old constraint if exists
ALTER TABLE contributions 
DROP CONSTRAINT IF EXISTS contributions_chama_id_member_id_month_year_key;

-- Add unique index that allows duplicates to be updated
CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_unique 
ON contributions(chama_id, member_id, month, year);

-- ============================================
-- 4. CREATE INVITE_LINKS TABLE (NEW FEATURE)
-- ============================================

CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  code VARCHAR(8) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_links_chama ON invite_links(chama_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_code ON invite_links(code);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY invite_links_chama_access ON invite_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = invite_links.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. VERIFY ALL COLUMNS EXIST
-- ============================================

-- Check members table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
ORDER BY ordinal_position;

-- Check contributions table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contributions'
ORDER BY ordinal_position;

-- Check invite_links table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invite_links'
ORDER BY ordinal_position;
