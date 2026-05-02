# Email Column Migration Guide

## Issue
The signup flow was failing because the `email` column doesn't exist in the `members` table schema.

## Solution
The code now works in two modes:
1. **Without email column** (current state) - signup works, creates member profile without email
2. **With email column** (after migration) - signup works, email-based signin works

## How to Run the Migration

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `ADD_EMAIL_TO_MEMBERS.sql`
4. Click **Run**

### Option 2: Using psql Command Line

```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f ADD_EMAIL_TO_MEMBERS.sql
```

### Option 3: Manual SQL

```sql
-- Add email column to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
```

## What the Migration Does

1. **Adds email column** - Allows storing email for phone-based signin
2. **Creates index** - Speeds up email lookups during signin
3. **Allows NULL values** - Existing members without email won't break

## After Migration

Once the migration is complete:
- ✅ Signup will work (as before)
- ✅ Signin will work (lookup phone → get email → signin)
- ✅ Member profile creation will store email
- ✅ Dashboard access will be secure

## Verification

After running the migration, check if the column exists:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name='members' AND column_name='email';
```

Should return: `email`

## Current Status

- ✅ Signup works without email column (creates member successfully)
- ✅ User will see warning in console if email column doesn't exist
- ⏳ Signin requires email column (won't work until migration runs)

## Timeline

1. **Now**: Deploy code with email-optional logic
2. **Soon**: Run ADD_EMAIL_TO_MEMBERS.sql migration
3. **After migration**: Signin flow will be fully functional
