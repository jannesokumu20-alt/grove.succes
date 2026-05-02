-- ============================================
-- COMPLETE GROVE DATABASE SCHEMA - PRODUCTION
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CHAMAS TABLE (Groups/Savings Circles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chamas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(8) NOT NULL UNIQUE,
  contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  meeting_day VARCHAR(20),
  savings_goal DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chamas_user_id ON public.chamas(user_id);
CREATE INDEX IF NOT EXISTS idx_chamas_invite_code ON public.chamas(invite_code);

-- ============================================
-- 2. MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  credit_score INTEGER DEFAULT 50,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_chama_id ON public.members(chama_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_chama_user ON public.members(chama_id, user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- 3. CONTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  note TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'reversed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contributions_chama_id ON public.contributions(chama_id);
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_month_year ON public.contributions(month, year);

-- ============================================
-- 4. LOANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 10.00,
  repayment_months INTEGER NOT NULL DEFAULT 12,
  monthly_payment DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'paid', 'overdue', 'defaulted')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,
  disbursed_at TIMESTAMP,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_chama_id ON public.loans(chama_id);
CREATE INDEX IF NOT EXISTS idx_loans_member_id ON public.loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

-- ============================================
-- 5. LOAN REPAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan_id ON public.loan_repayments(loan_id);

-- ============================================
-- 6. FINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
  due_date DATE,
  paid_date DATE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fines_chama_id ON public.fines(chama_id);
CREATE INDEX IF NOT EXISTS idx_fines_member_id ON public.fines(member_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON public.fines(status);

-- ============================================
-- 7. MEETINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meetings_chama_id ON public.meetings(chama_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);

-- ============================================
-- 8. MEETING ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  attendance_status VARCHAR(20) DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'excused')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting_id ON public.meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_member_id ON public.meeting_attendance(member_id);

-- ============================================
-- 9. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_chama_id ON public.announcements(chama_id);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);

-- ============================================
-- 10. REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_type VARCHAR(50) NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'snoozed')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_chama_id ON public.reminders(chama_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.reminders(status);

-- ============================================
-- 11. CONTRIBUTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contribution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  monthly_amount DECIMAL(10, 2) NOT NULL,
  collection_frequency VARCHAR(50) DEFAULT 'monthly',
  target_amount DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contribution_plans_chama_id ON public.contribution_plans(chama_id);

-- ============================================
-- 12. MEMBER WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.member_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) DEFAULT 0,
  total_contributed DECIMAL(12, 2) DEFAULT 0,
  total_expected DECIMAL(12, 2) DEFAULT 0,
  missed_contributions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chama_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_wallets_chama ON public.member_wallets(chama_id);
CREATE INDEX IF NOT EXISTS idx_member_wallets_member ON public.member_wallets(member_id);

-- ============================================
-- 13. INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  invite_code VARCHAR(8) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'rejected')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  accepted_at TIMESTAMP,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invites_chama_id ON public.invites(chama_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- Note: RLS is temporarily disabled to prevent infinite recursion
-- RLS can be enabled per-table if needed in the future

-- Chamas - RLS disabled
ALTER TABLE public.chamas DISABLE ROW LEVEL SECURITY;

-- Members - RLS disabled  
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- Contributions - RLS disabled
ALTER TABLE public.contributions DISABLE ROW LEVEL SECURITY;

-- Loans - RLS disabled
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;

-- Fines - RLS disabled
ALTER TABLE public.fines DISABLE ROW LEVEL SECURITY;

-- Meetings - RLS disabled
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;

-- Announcements - RLS disabled
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;

-- Reminders - RLS disabled
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;

-- Contribution Plans - RLS disabled
ALTER TABLE public.contribution_plans DISABLE ROW LEVEL SECURITY;

-- Member Wallets - RLS disabled
ALTER TABLE public.member_wallets DISABLE ROW LEVEL SECURITY;

-- Invites - RLS disabled
ALTER TABLE public.invites DISABLE ROW LEVEL SECURITY;
