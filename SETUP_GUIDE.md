# 🌿 Grove Setup Guide

## Quick Start

### 1. Configure Supabase

Your `.env.local` file should contain:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
AT_USERNAME=your_africas_talking_username
AT_API_KEY=your_africas_talking_api_key
```

✅ You've already done this!

### 2. Deploy Database Schema

**IMPORTANT:** The database tables and RLS policies must be created first!

#### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Sign in and open your project
   - Click on "SQL Editor" in the left sidebar

2. **Create New Query**
   - Click "New Query"
   - Click "New Query" button again (top right)

3. **Paste the Schema**
   - Open the file: `SUPABASE_SCHEMA.sql` in your project
   - Copy all the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in Supabase
   - You should see these tables:
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

### 3. Enable RLS (Row Level Security)

The schema already includes RLS policies, but verify they're enabled:

1. For each table, click on it in Table Editor
2. Click "RLS" button at the top right
3. Make sure the toggle is **ON** (green)

### 4. Test the Connection

Run the dev server:
```bash
npm run dev
```

The app should now be running at `http://localhost:3002`

### 5. Create a Test Account

1. Go to http://localhost:3002
2. Click "Sign up"
3. Fill in your details:
   - Full Name: Test User
   - Email: test@example.com
   - Password: test123456
   - Phone: +254712345678
   - Chama Name: Test Chama
   - Contribution Amount: 1000
   - Meeting Day: Monday

4. You should be redirected to login
5. Log in with your credentials
6. You should see the dashboard with your chama stats

## Troubleshooting

### "Failed to fetch" or "Supabase not configured"
- ✅ Check `.env.local` has correct Supabase URL and Key
- ✅ Verify the database schema was deployed (check Tables in Supabase)
- ✅ Make sure RLS is enabled on all tables

### "No chama found"
- This is normal for new users
- Click "Create Chama" button to create one

### "Error: Invalid supabaseUrl"
- ✅ Make sure NEXT_PUBLIC_SUPABASE_URL format is correct
- Should look like: `https://xxxxx.supabase.co`
- Not `http://` - must be `https://`

### Tables not showing data after signup
- ✅ Check RLS policies allow inserts
- ✅ Go to Supabase > Authentication > Users
- ✅ Verify your test user exists
- ✅ Check the tables have rows

### Still having issues?
Check the browser console (F12) for error messages and share them

## Database Schema Summary

**13 Tables:**
1. `chamas` - Savings groups
2. `members` - Group members with credit scores
3. `contributions` - Monthly member contributions
4. `loans` - Member loans with repayment tracking
5. `loan_repayments` - Individual loan repayments
6. `fines` - Member fines
7. `meetings` - Group meetings
8. `meeting_attendance` - Who attended meetings
9. `announcements` - Group announcements
10. `reminders` - SMS reminders sent
11. `mpesa_transactions` - Payment records
12. `shares` - SACCO share system (optional)
13. `whatsapp_logs` - WhatsApp integration logs (optional)

## Features Status

✅ Authentication (Signup, Login, Join via invite)
✅ Chama Management (Create, Edit, View settings)
✅ Members (Add, View, Invite)
✅ Contributions (Record, Track monthly)
✅ Loans (Create, Approve, Record repayments)
✅ Reports (Analytics, Health indicators)
✅ SMS Reminders (Africa's Talking API ready)
✅ Responsive (Works on mobile & desktop)
✅ Dark Theme (Professional dark UI)

## Next Steps After Setup

1. Test all features with demo data
2. Customize the chama name and settings
3. Invite other members
4. Record some contributions
5. Create and approve a test loan
6. Check reports page for analytics

## API Configuration

The app is ready for these integrations:
- **Africa's Talking SMS** - Update `AT_USERNAME` and `AT_API_KEY`
- **MPESA Payments** - Routes ready at `/api/payments/*`
- **WhatsApp** - Bot integration templates included

## Getting Help

- Check browser console (F12) for errors
- Look at `.env.local` for environment variables
- Verify Supabase tables exist and have RLS enabled
- Restart dev server after updating `.env.local`
