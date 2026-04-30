-- ============================================
-- GROVE - FIX SUPABASE RLS & SCHEMA CACHE
-- Run these fixes in Supabase SQL Editor
-- ============================================

-- Step 1: Check RLS is enabled
ALTER TABLE chamas ENABLE ROW LEVEL SECURITY;

-- Step 2: Verify and recreate RLS policies if needed
DROP POLICY IF EXISTS chama_owner_policy ON chamas;

CREATE POLICY chama_owner_policy ON chamas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Enable RLS on related tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify columns exist and are correct type
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'chamas'
ORDER BY ordinal_position;

-- Step 5: Test insert with proper schema
-- This should work if RLS is correct
INSERT INTO chamas (
  user_id, 
  name, 
  invite_code, 
  contribution_amount,
  meeting_day,
  savings_goal
) VALUES (
  auth.uid(),
  'Test Chama',
  'TEST' || substr(gen_random_uuid()::text, 1, 4),
  5000,
  'Monday',
  100000
) ON CONFLICT DO NOTHING;

-- Verify it was inserted
SELECT id, name, contribution_amount, meeting_day, savings_goal FROM chamas LIMIT 1;
