-- ============================================
-- MIGRATION: Add Missing Columns to Chamas Table
-- ============================================
-- Run this in Supabase SQL Editor if columns don't exist

-- Check if columns exist, if not add them
ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS meeting_day VARCHAR(20) DEFAULT 'Monday';

ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS savings_goal DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- Add Missing Columns to Contributions Table
-- ============================================
ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- ============================================
-- Add Missing Columns to Loans Table
-- ============================================
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- Verify Tables
-- ============================================
-- SELECT * FROM chamas LIMIT 1;
-- SELECT * FROM members LIMIT 1;
-- SELECT * FROM contributions LIMIT 1;
-- SELECT * FROM loans LIMIT 1;
