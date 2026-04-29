# 🔧 Fix Supabase Credentials - URGENT

## ⚠️ Problem Identified

Your app is showing **`net::ERR_NAME_NOT_RESOLVED`** error because the Supabase project URL in `.env.local` is **invalid/non-existent**:

```
Current URL: https://wtyjsqktcvbbjlewxrng.supabase.com
❌ This domain does not exist
```

The DNS lookup shows:
```
*** can't find wtyjsqktcvbbjlewxrng.supabase.com: Non-existent domain
```

## ✅ Solution - Update .env.local

You need to replace the credentials with your **actual** Supabase project credentials.

### Step 1: Get Your Real Credentials

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select Your Project** (create one if you don't have it)
3. **Go to Settings** → **API**
4. **Copy these values:**
   - **Project URL**: Labeled as "Project URL" (looks like `https://xxxxx.supabase.co`)
   - **Anon Public Key**: Labeled as "anon public" (long JWT token starting with `eyJ...`)

### Step 2: Update .env.local

Edit `.env.local` in your Grove project root and replace:

```env
# ❌ OLD (INVALID)
NEXT_PUBLIC_SUPABASE_URL=https://wtyjsqktcvbbjlewxrng.supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0eWpzcWt0Y3ZiYmpsZXd4cm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTExMjYsImV4cCI6MjA5Mjc2NzEyNn0.3D8lxS2QRwtO5KhWa8-1sCirVdy8AvN4JBxFG8vvB24

# ✅ NEW (YOUR ACTUAL CREDENTIALS)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### Step 3: Restart Dev Server

```powershell
# In your Grove project terminal:
Ctrl+C  # Stop current server
npm run dev  # Restart
```

### Step 4: Verify It Works

1. Open http://localhost:3000
2. Try to login again
3. Should work without `ERR_NAME_NOT_RESOLVED` errors

---

## 🆘 If You Still Have Issues

**Before contacting support, verify:**

1. ✅ **Credentials are from an ACTIVE Supabase project** (not deleted/archived)
2. ✅ **URL is correct format**: `https://xxxxx.supabase.co` (ends in `.co` not `.com`)
3. ✅ **Dev server restarted** after updating .env.local
4. ✅ **No spaces/quotes in .env.local** around values

**Test DNS resolution after updating:**
```powershell
# Should resolve successfully (not "Non-existent domain")
nslookup YOUR_PROJECT_REF.supabase.co
```

---

## 📝 Current .env.local Location

`c:\Users\Dart Technologies\Desktop\cassa\grove\.env.local`

---

## 🚀 Next Steps After Fix

Once login works:
1. **Deploy database schema** using SUPABASE_SCHEMA.sql
2. **Sign up** to create your first chama
3. **Access dashboard** to verify data loads

See **SETUP_GUIDE.md** for complete setup instructions.
