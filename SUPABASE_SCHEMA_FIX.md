# Grove App - Supabase Schema Fix Guide

## Problem Identified
The Supabase `chamas` table is missing columns that the code expects:
- `contribution_amount` (DECIMAL 10,2)
- `savings_goal` (DECIMAL 15,2)  
- `meeting_day` (VARCHAR 20)

Error message: "Could not find the 'contribution_amount' column of 'chamas' in the schema cache"

## Solution
Run the SQL migration in your Supabase SQL Editor:

### Step 1: Go to Supabase Console
1. Visit https://app.supabase.com
2. Select your Grove project
3. Go to SQL Editor (or SQL)

### Step 2: Run the Migration
Copy and paste the contents of `SUPABASE_FIX_TABLES.sql` into the SQL Editor and click "Run"

### Step 3: Verify Success
Check that all columns were added:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'chamas' ORDER BY ordinal_position;
```

You should see:
- id
- user_id
- name
- invite_code
- contribution_amount ✓
- meeting_day ✓
- savings_goal ✓
- created_at
- updated_at

### Step 4: Clear Browser Cache
1. Refresh the browser (Ctrl+R or Cmd+R)
2. Try signup again

## Expected Schema After Fix

```sql
CREATE TABLE chamas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(8) NOT NULL UNIQUE,
  contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  meeting_day VARCHAR(20) DEFAULT 'Monday',
  savings_goal DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## What to Test After Fix

Once the schema is corrected, test the following flows:

### 1. Signup Flow
- ✓ Create new account with chama
- ✓ Verify chama created with correct contribution amount

### 2. Members
- ✓ Add a test member
- ✓ View member list
- ✓ Delete a member

### 3. Contributions  
- ✓ Record a contribution
- ✓ View contribution history
- ✓ Filter by month/year

### 4. Loans
- ✓ Create a loan
- ✓ Approve a loan
- ✓ Record loan repayment
- ✓ View loan status

### 5. Settings
- ✓ Update contribution amount
- ✓ Update meeting day
- ✓ Update savings goal

### 6. Errors
- ✓ Try to access without auth (should redirect to login)
- ✓ Invalid invite code (should show error)
- ✓ Network error handling

## RLS Policies to Check

Make sure these policies exist in Supabase:

### chamas table RLS
```sql
CREATE POLICY chama_owner_policy ON chamas
  FOR ALL USING (auth.uid() = user_id);
```

### members table RLS
```sql
CREATE POLICY members_chama_access ON members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas 
      WHERE chamas.id = members.chama_id 
      AND chamas.user_id = auth.uid()
    )
  );
```

### contributions table RLS
```sql
CREATE POLICY contributions_chama_access ON contributions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas 
      WHERE chamas.id = contributions.chama_id 
      AND chamas.user_id = auth.uid()
    )
  );
```

## If Still Having Issues

1. Check Supabase logs: SQL Editor → Run → Check error details
2. Verify auth is working: Try login with existing account
3. Check RLS policies are enabled: Settings → Auth → Policies
4. Disable RLS temporarily for testing (not recommended for production):
   ```sql
   ALTER TABLE chamas DISABLE ROW LEVEL SECURITY;
   ```

## Next Steps

After fixing the schema:
1. Return to browser and refresh
2. Try signup flow again  
3. Follow end-to-end testing script in E2E_TEST_SUITE.md
