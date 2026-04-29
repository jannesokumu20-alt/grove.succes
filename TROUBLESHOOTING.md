# 🔧 Troubleshooting "Failed to Fetch" Errors

## The Problem

You're seeing "Failed to fetch" errors because the database schema hasn't been deployed to your Supabase project yet.

## The Solution - Deploy Database Schema

Follow these steps **carefully**:

### Step 1: Open Supabase Console

1. Go to https://supabase.com
2. Log in with your account
3. Click on your project (the one you used credentials from)
4. You should see the project dashboard

### Step 2: Go to SQL Editor

1. In the left sidebar, click on **"SQL Editor"** (the code icon)
2. You'll see a list of pre-written queries on the right
3. Click on **"New query"** button (top right area)
4. A blank SQL editor should open

### Step 3: Copy the Database Schema

1. Open the file `SUPABASE_SCHEMA.sql` from your project folder
2. **Copy ALL the SQL code** (Ctrl+A, then Ctrl+C)
3. Paste it into the SQL editor you just opened (Ctrl+V)

### Step 4: Run the Schema

1. You should see a lot of SQL commands in the editor
2. Click the blue **"Run"** button (or press Ctrl+Enter)
3. Wait for it to complete (this may take 30 seconds)
4. You should see a message like "Execution completed successfully"

### Step 5: Verify the Tables Were Created

1. In the left sidebar, click on **"Table Editor"**
2. You should now see a list of tables:
   - chamas
   - members
   - contributions
   - loans
   - loan_repayments
   - fines
   - meetings
   - meeting_attendance
   - announcements
   - reminders
   - mpesa_transactions
   - shares
   - whatsapp_logs

**If you see all these tables, you're good!**

### Step 6: Restart the Dev Server

1. In your terminal, press `Ctrl+C` to stop the dev server
2. Run `npm run dev` again
3. The app should now be working!

## Test the Connection

1. Go to http://localhost:3002
2. Click "Sign up"
3. Fill in the form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test123456!`
   - Confirm: `Test123456!`
4. Click "Continue"
5. Fill in chama details:
   - Phone: `+254712345678`
   - Chama Name: `My Test Group`
   - Contribution: `1000`
   - Meeting Day: `Monday`
6. Click "Sign Up"
7. You should see "Account created successfully!"
8. Wait and you'll be redirected to login
9. Log in with your email and password
10. You should see the **Dashboard** with your chama stats!

## Common Issues & Fixes

### "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"

**Problem:** Supabase URL is in wrong format

**Fix:**
- Open `.env.local`
- Check `NEXT_PUBLIC_SUPABASE_URL` - should look like:
  ```
  https://xxxxx.supabase.co
  ```
- Not `http://` (must be https)
- Not `https://xxxxx.supabase.com` (must be `.co`)
- Copy the exact URL from Supabase dashboard

### "Supabase is not configured"

**Problem:** Env variables not set

**Fix:**
- Make sure `.env.local` exists in the grove folder
- Has both SUPABASE_URL and SUPABASE_ANON_KEY
- Restart dev server (`Ctrl+C` then `npm run dev`)

### "Failed to fetch" when signing up

**Problem:** Database tables don't exist

**Fix:**
- Deploy the schema (see Step 1-4 above)
- Make sure you see all 13 tables in Table Editor
- If tables exist but signup still fails:
  - Go to Supabase > Authentication > Settings
  - Make sure "Confirm email" is OFF (for testing)
  - Try signup again

### "No chama found" after login

**Problem:** This is actually NORMAL for existing users without a chama

**Fix:**
- Click the "Create Chama" button
- Or the signup flow should have created one already

### Tables created but still getting errors

**Problem:** RLS policies might be blocking

**Fix:**
1. Go to Table Editor in Supabase
2. For each table, look for an **"RLS"** button (top right)
3. Make sure the toggle is **ON** (green)
4. The schema should have set up policies automatically
5. If not, contact Supabase support

## Verify Everything Works

After deploying the schema, test these:

### Test 1: Sign Up
- [ ] Can create account
- [ ] Redirects to login
- [ ] See "Account created" message

### Test 2: Login
- [ ] Can login with credentials
- [ ] Redirects to dashboard
- [ ] See dashboard stats

### Test 3: Add Member
- [ ] Click Members tab
- [ ] Click "Add Member" button
- [ ] Fill in and save
- [ ] See member in list

### Test 4: Record Contribution
- [ ] Click Contributions tab
- [ ] Click "Record Contribution"
- [ ] Select member and amount
- [ ] See contribution recorded

### Test 5: Create Loan
- [ ] Click Loans tab
- [ ] Click "Create Loan"
- [ ] See auto-calculated repayment
- [ ] Create loan

## Still Having Issues?

### Check these files:

1. **`.env.local`** - Has correct Supabase credentials?
2. **`SUPABASE_SCHEMA.sql`** - Was it fully executed in SQL editor?
3. **Table Editor** - Do all 13 tables exist?
4. **Browser Console** - Press F12, go to Console tab
5. **Terminal** - Are there error messages in npm run dev?

### Get Help:

1. Check browser console (F12) for specific error
2. Look at terminal output for errors
3. Verify all 13 tables exist in Supabase
4. Make sure .env.local has correct credentials
5. Restart dev server after any changes

## Screenshots Guide

When sharing your issue:
1. F12 to open console
2. Screenshot the error message
3. Share screenshot of Supabase Table Editor (showing tables)
4. Share content of your `.env.local` (hide sensitive parts)
5. Share the terminal error message

## Key Points Remember

✅ Supabase URL format: `https://xxxxx.supabase.co` (NOT .com)
✅ Anon Key: Long JWT token starting with `eyJ...`
✅ Schema: Must be deployed to create tables
✅ RLS: Must be enabled on each table
✅ Restart: Dev server after changing `.env.local`
✅ Test: Try signup/login after setup

## What the Schema Creates

- **Chamas Table**: Groups of people saving together
- **Members Table**: People in each chama (credit score tracking)
- **Contributions Table**: Money saved each month
- **Loans Table**: Money borrowed (with interest calculation)
- **Loan Repayments Table**: Tracking repayment progress
- **Fines Table**: Penalties for missed contributions
- Plus: Meetings, Announcements, SMS Reminders, Payment tracking

## API Routes (Already Configured)

The app includes these ready-to-use endpoints:

- `POST /api/reminders/send` - Send SMS reminders
- `GET /api/reminders/check` - Check notification status
- `POST /api/payments/initiate` - Start payment via Africa's Talking
- `POST /api/payments/callback` - Handle payment response

Just add your Africa's Talking credentials to `.env.local`!

---

**Need more help?** Check the SETUP_GUIDE.md file for step-by-step setup instructions.
