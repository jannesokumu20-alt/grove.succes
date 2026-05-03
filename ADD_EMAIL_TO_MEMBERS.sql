-- Migration: Add email column to members table for phone-based authentication
-- This is required for the signin flow to work without admin API access

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);

-- Optional: Add unique constraint if needed (allowing NULLs for existing members without email)
-- ALTER TABLE public.members ADD CONSTRAINT unique_members_email UNIQUE (email) WHERE email IS NOT NULL;
