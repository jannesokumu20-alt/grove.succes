# DATABASE SCHEMA FIX - ACTION REQUIRED

## Problem
Your Grove app is deployed and working, but Supabase database tables are missing critical columns:
- `chamas.contribution_amount` - Monthly contribution amount
- `chamas.meeting_day` - Meeting day
- `chamas.savings_goal` - Savings goal
- `contributions.created_at` - Timestamp
- `contributions.contribution_amount` - Amount
- `loans.created_at` - Timestamp

## Solution
Run the following SQL in your Supabase SQL Editor:

### Step 1: Go to Supabase Console
1. Visit https://supabase.com
2. Login to your account
3. Select your Grove project
4. Go to SQL Editor

### Step 2: Copy and Paste This SQL
```sql
-- Add missing columns to chamas table
ALTER TABLE chamas
ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS meeting_day VARCHAR(20) DEFAULT 'Monday',
ADD COLUMN IF NOT EXISTS savings_goal DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to contributions table
ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Add missing columns to loans table
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Verify success
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('chamas', 'contributions', 'loans')
ORDER BY table_name, ordinal_position;
```

### Step 3: Run the Query
Click "RUN" button (or Cmd+Enter on Mac, Ctrl+Enter on Windows)

### Step 4: Verify
You should see output showing all columns are now present.

## After Fix
Once columns are added:
1. Restart the dev server: `npm run dev`
2. Test signup again
3. All features will work (members, loans, contributions, etc.)

## Test Credentials
- Email: testuser@grove.com
- Password: TestPassword123!
- Chama: Test Chama
- Monthly Contribution: 5000 KES

## Features to Test After Fix
✅ Sign up
✅ Add member
✅ Record contribution
✅ Create loan
✅ Approve loan
✅ Record repayment
✅ View reports
✅ Export data
