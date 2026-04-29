#!/bin/bash

# ============================================
# GROVE - VERCEL DEPLOYMENT SCRIPT
# ============================================

# This script helps deploy Grove to Vercel
# Make sure you have:
# 1. Vercel CLI installed: npm i -g vercel
# 2. Git repository with commits
# 3. Supabase project created

echo "🌿 Grove - Vercel Deployment Setup"
echo "===================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized"
    echo "Run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "✅ package.json found"
echo ""

# Get Supabase credentials from user
echo "📝 Supabase Setup (Get credentials from https://supabase.com)"
echo ""

read -p "Enter NEXT_PUBLIC_SUPABASE_URL (https://...supabase.co): " SUPABASE_URL
read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_KEY

# Optional Africa's Talking
read -p "Enter AT_USERNAME (or leave blank): " AT_USERNAME
read -p "Enter AT_API_KEY (or leave blank): " AT_API_KEY

echo ""
echo "📦 Environment Variables Summary:"
echo "================================="
echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=****[hidden]****"
if [ ! -z "$AT_USERNAME" ]; then
    echo "AT_USERNAME=$AT_USERNAME"
    echo "AT_API_KEY=****[hidden]****"
fi
echo ""

read -p "Continue with deployment? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Deploy with environment variables
vercel --env NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
        --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_KEY" \
        --env AT_USERNAME="$AT_USERNAME" \
        --env AT_API_KEY="$AT_API_KEY"

echo ""
echo "✅ Deployment started!"
echo ""
echo "📝 Next steps:"
echo "1. Watch the deployment progress in your browser"
echo "2. Once deployed, your app is live at the provided URL"
echo "3. Go to Supabase Dashboard"
echo "4. Run SUPABASE_SCHEMA.sql if database not set up yet"
echo "5. Create your first account and test!"
echo ""
