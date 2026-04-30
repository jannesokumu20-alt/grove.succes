-- ============================================
-- GROVE - FIX CHAMAS TABLE COLUMNS
-- Run this in Supabase SQL Editor to fix schema mismatch
-- ============================================

-- Check current chamas table structure
-- SELECT * FROM information_schema.columns WHERE table_name = 'chamas';

-- Add missing columns to chamas table if they don't exist
ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS savings_goal DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS meeting_day VARCHAR(20) DEFAULT 'Monday';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chamas' 
ORDER BY ordinal_position;

-- Test: Try to insert a test record to verify columns work
-- INSERT INTO chamas (user_id, name, invite_code, contribution_amount, meeting_day, savings_goal)
-- VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'Test', 'TEST1234', 5000, 'Monday', 100000)
-- ON CONFLICT DO NOTHING;
