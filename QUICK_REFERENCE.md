# 🚀 Grove - Quick Reference Card

## The Issue
You're seeing "Failed to fetch" errors - database isn't set up yet

## The Fix (5 minutes)

### Step 1: Supabase Console
```
https://supabase.com → Sign in → Click your project
```

### Step 2: SQL Editor
```
Left sidebar → SQL Editor → "New query"
```

### Step 3: Paste Schema
```
Copy: SUPABASE_SCHEMA.sql (entire file)
Paste into SQL editor
Click: RUN button
Wait: ~30 seconds
```

### Step 4: Verify Tables
```
Left sidebar → Table Editor
Should see: chamas, members, contributions, loans, etc.
```

### Step 5: Restart App
```
Terminal: Ctrl+C (stop npm run dev)
Terminal: npm run dev (restart)
Browser: Go to http://localhost:3002
```

### Step 6: Test
```
Click: Sign up
Fill in: Full Name, Email, Password
Click: Continue
Fill in: Phone, Chama Name, Contribution, Day
Click: Sign Up
Expected: "Account created successfully!"
Then: Login with your email/password
See: Dashboard with stats
```

---

## Env Variables Needed

File: `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
AT_USERNAME=your_africas_talking_username
AT_API_KEY=your_africas_talking_api_key
```

Get from Supabase:
1. Settings (gear icon)
2. API
3. Copy URL and anon key

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Still getting errors | Restart dev server |
| Tables don't appear | Make sure schema completed fully |
| Login doesn't work | Check browser F12 console for errors |
| Can't create account | Verify .env.local variables |
| Page loading forever | Check "No chama found" message (create one) |

---

## Browser Console Debug (F12)

Press **F12** → Go to **Console** tab → Try signup → Look for red errors

---

## Terminal Debug

Watch `npm run dev` output while testing - errors appear in red

---

## Files You Need

✅ `.env.local` - Your Supabase credentials  
✅ `SUPABASE_SCHEMA.sql` - Deploy this to create tables  
✅ `SETUP_GUIDE.md` - Detailed setup guide  
✅ `TROUBLESHOOTING.md` - Detailed error fixes  

---

## All 13 Tables That Should Exist

1. chamas
2. members
3. contributions
4. loans
5. loan_repayments
6. fines
7. meetings
8. meeting_attendance
9. announcements
10. reminders
11. mpesa_transactions
12. shares
13. whatsapp_logs

---

## Features Available Now

✅ Sign up / Sign in  
✅ Create chama  
✅ Join via invite link  
✅ Add members  
✅ Record contributions  
✅ Create loans  
✅ Record repayments  
✅ View dashboard  
✅ View reports  
✅ Edit settings  

---

## Next: Africa's Talking Setup (Optional)

To enable SMS reminders and payments:

1. Create account: https://africastalking.com
2. Get credentials
3. Add to `.env.local`:
   ```
   AT_USERNAME=your_username
   AT_API_KEY=your_api_key
   ```
4. Restart app
5. SMS features now active

---

## Success Indicators

✅ App loads at http://localhost:3002  
✅ Can sign up and create account  
✅ Can login successfully  
✅ Dashboard shows stats  
✅ Can add members  
✅ Can record contributions  
✅ Can create and approve loans  
✅ Can view analytics  

---

## Emergency Reset

If everything breaks:

```bash
# Stop app
Ctrl+C

# Clear cache
rm -r node_modules
rm package-lock.json

# Reinstall
npm install

# Start fresh
npm run dev
```

---

## Key URLs

- **App**: http://localhost:3002
- **Supabase**: https://supabase.com
- **Africa's Talking**: https://africastalking.com
- **Docs**: SETUP_GUIDE.md, TROUBLESHOOTING.md

---

## One More Thing

⚠️ **MOST IMPORTANT**: The schema file (`SUPABASE_SCHEMA.sql`) MUST be deployed to your Supabase before the app will work. This creates all the database tables that the app needs.

If you get "failed to fetch" errors after following these steps, check:
1. Schema was deployed (run in SQL Editor)
2. All 13 tables exist (check Table Editor)
3. Dev server was restarted
4. `.env.local` has correct credentials

---

**Questions?** Read SETUP_GUIDE.md or TROUBLESHOOTING.md
