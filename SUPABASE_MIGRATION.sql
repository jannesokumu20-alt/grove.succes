-- ============================================
-- GROVE DATABASE MIGRATION - ADD MISSING COLUMNS
-- Run this in Supabase SQL Editor to fix existing tables
-- ============================================

-- Add missing columns to members table
ALTER TABLE members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to contributions table
ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS recorded_by UUID;

-- Update unique constraint on contributions to allow updates
-- Remove old constraint and add new one that handles duplicates
ALTER TABLE contributions 
DROP CONSTRAINT IF EXISTS contributions_chama_id_member_id_month_year_key;

-- Add proper unique index that allows NULL values for upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_unique 
ON contributions(chama_id, member_id, month, year) 
WHERE deleted_at IS NULL;

-- ============================================
-- Set default values for any NULL recorded_by
-- ============================================
UPDATE contributions 
SET recorded_by = auth.uid() 
WHERE recorded_by IS NULL;

-- If that doesn't work (for system records), use a placeholder
UPDATE contributions 
SET recorded_by = '00000000-0000-0000-0000-000000000000'::uuid
WHERE recorded_by IS NULL;

-- Make recorded_by NOT NULL
ALTER TABLE contributions
ALTER COLUMN recorded_by SET NOT NULL;

-- ============================================
-- Verify all columns exist
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('members', 'contributions')
ORDER BY table_name, ordinal_position;
