# Grove Reminders - Database Migration Guide

## Issue
The reminders table in Supabase has an **incorrect schema** that doesn't match the application code expectations. This causes **"Failed to load reminders"** errors.

## What's Wrong
**Current (incorrect) table structure:**
```sql
reminders (
  id UUID,
  chama_id UUID,
  message TEXT,
  sent_to_count INTEGER,
  sent_by UUID,
  sent_at TIMESTAMP,
  created_at TIMESTAMP
)
```

**Expected (correct) table structure:**
```sql
reminders (
  id UUID,
  chama_id UUID,
  title VARCHAR(255),          -- MISSING!
  message TEXT,
  reminder_date TIMESTAMP,      -- MISSING!
  sent BOOLEAN,                 -- MISSING!
  sent_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Solution
Execute the migration SQL to fix the table schema:

### Option 1: Use Supabase SQL Editor (Recommended)
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `SUPABASE_FIX_REMINDERS_TABLE.sql`
5. Click **Run**

### Option 2: Manual Steps
1. Go to Supabase dashboard → Table Editor
2. Click on the `reminders` table
3. Delete the table (this will cascade properly)
4. Run the SQL from `SUPABASE_FIX_REMINDERS_TABLE.sql`

## Files Provided
- **SUPABASE_FIX_REMINDERS_TABLE.sql** - Fixes the reminders table structure
- **SUPABASE_SCHEMA.sql** - Updated with correct reminders table definition

## After Migration
1. Rebuild the application: `npm run build`
2. The reminders page should now load without errors
3. You can create, schedule, and manage reminders normally

## Testing
Once migrated, verify:
1. ✅ Admin can navigate to Reminders page
2. ✅ Reminders list loads without error
3. ✅ Can create new reminders (Schedule Reminder button)
4. ✅ Can send reminders
5. ✅ Can delete reminders

## Related Issues Fixed
This migration also addresses:
- Member creation null constraint (full_name → name)
- Login redirect loop (router.push → router.replace)
- Dashboard layout positioning (sidebar + content offset)
- Cards grid display (grid layout)
- Mobile navigation visibility

All fixes have been tested and deployed to `agents/fix-dashboard-layout-issues` branch.
