-- ============================================
-- GROVE - ADD TEST DATA FOR COMPREHENSIVE TESTING
-- Run this in Supabase SQL Editor
-- ============================================

-- First, get the test user ID (alice.kipchoge@grovetest.com)
-- Run this query first to find the user:
-- SELECT id, email FROM auth.users WHERE email = 'alice.kipchoge@grovetest.com';

-- Assuming we have the user ID from above, replace USER_ID_HERE with actual UUID

-- Get the chama that was created during signup (Nairobi Test Savers)
-- SELECT id, name, invite_code FROM chamas WHERE name = 'Nairobi Test Savers' LIMIT 1;

-- Assuming we have chama ID, replace CHAMA_ID_HERE with actual UUID

-- ============================================
-- Add Test Members
-- ============================================
INSERT INTO members (chama_id, name, phone, status, credit_score)
VALUES
  ('CHAMA_ID_HERE'::uuid, 'John Kariuki', '0712345678', 'active', 75),
  ('CHAMA_ID_HERE'::uuid, 'Mary Kipchoge', '0723456789', 'active', 80),
  ('CHAMA_ID_HERE'::uuid, 'James Omondi', '0734567890', 'active', 70),
  ('CHAMA_ID_HERE'::uuid, 'Sarah Mwangi', '0745678901', 'active', 85)
ON CONFLICT DO NOTHING;

-- ============================================
-- Add Test Contributions (for April & May 2026)
-- ============================================
-- For each member, add contributions for April and May 2026
-- Get member IDs first:
-- SELECT id, name FROM members WHERE chama_id = 'CHAMA_ID_HERE'::uuid;

INSERT INTO contributions (member_id, chama_id, amount, month, year, status)
SELECT 
  m.id,
  'CHAMA_ID_HERE'::uuid,
  5000,  -- contribution_amount
  4,     -- April
  2026,
  'completed'
FROM members m
WHERE m.chama_id = 'CHAMA_ID_HERE'::uuid
ON CONFLICT DO NOTHING;

INSERT INTO contributions (member_id, chama_id, amount, month, year, status)
SELECT 
  m.id,
  'CHAMA_ID_HERE'::uuid,
  5000,
  5,     -- May
  2026,
  'completed'
FROM members m
WHERE m.chama_id = 'CHAMA_ID_HERE'::uuid
ON CONFLICT DO NOTHING;

-- ============================================
-- Add Test Loans
-- ============================================
-- Get a member ID to create loan for
-- SELECT id, name FROM members WHERE chama_id = 'CHAMA_ID_HERE'::uuid LIMIT 1;

INSERT INTO loans (chama_id, member_id, amount, interest_rate, term_months, purpose, status)
VALUES
  ('CHAMA_ID_HERE'::uuid, 'MEMBER_ID_HERE'::uuid, 50000, 10, 12, 'Business Expansion', 'approved'),
  ('CHAMA_ID_HERE'::uuid, (SELECT id FROM members WHERE chama_id = 'CHAMA_ID_HERE'::uuid LIMIT 1 OFFSET 1), 30000, 8, 6, 'Education', 'pending')
ON CONFLICT DO NOTHING;

-- ============================================
-- Add Test Loan Repayments
-- ============================================
-- Get approved loan ID first:
-- SELECT id FROM loans WHERE chama_id = 'CHAMA_ID_HERE'::uuid AND status = 'approved' LIMIT 1;

INSERT INTO loan_repayments (loan_id, amount, repayment_date, status)
VALUES
  ('LOAN_ID_HERE'::uuid, 5000, NOW(), 'completed'),
  ('LOAN_ID_HERE'::uuid, 5000, NOW() - INTERVAL '1 month', 'completed')
ON CONFLICT DO NOTHING;

-- ============================================
-- Verify Data was added
-- ============================================
SELECT 'Members' AS table_name, COUNT(*) AS count FROM members WHERE chama_id = 'CHAMA_ID_HERE'::uuid
UNION ALL
SELECT 'Contributions', COUNT(*) FROM contributions WHERE chama_id = 'CHAMA_ID_HERE'::uuid
UNION ALL
SELECT 'Loans', COUNT(*) FROM loans WHERE chama_id = 'CHAMA_ID_HERE'::uuid
UNION ALL
SELECT 'Repayments', COUNT(*) FROM loan_repayments;
