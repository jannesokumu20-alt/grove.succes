-- ============================================
-- GROVE DATABASE SCHEMA - DEPLOY IN CHUNKS
-- Copy each section separately into Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: CREATE TABLES (Copy this first)
-- ============================================

-- 1. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_type VARCHAR(50),
  payment_method VARCHAR(50),
  mpesa_code VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MEETING_ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT false,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. REMINDERS TABLE (Drop old one first if exists)
DROP TABLE IF EXISTS reminders CASCADE;

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE,
  reminder_type VARCHAR(50),
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MEMBER_WALLETS TABLE
CREATE TABLE IF NOT EXISTS member_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  total_contributed DECIMAL(15, 2) DEFAULT 0,
  total_borrowed DECIMAL(15, 2) DEFAULT 0,
  balance DECIMAL(15, 2) DEFAULT 0,
  missed_contributions INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MONTHLY_CONTRIBUTION_SUMMARY TABLE
CREATE TABLE IF NOT EXISTS monthly_contribution_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  expected_amount DECIMAL(15, 2),
  actual_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50),
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONTRIBUTION_INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS contribution_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL UNIQUE REFERENCES chamas(id) ON DELETE CASCADE,
  total_members INT DEFAULT 0,
  total_contributed DECIMAL(15, 2) DEFAULT 0,
  total_expected DECIMAL(15, 2) DEFAULT 0,
  avg_contribution DECIMAL(15, 2) DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  top_contributor_id UUID REFERENCES members(id) ON DELETE SET NULL,
  top_contributor_amount DECIMAL(15, 2),
  defaulters_count INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. AUTOMATION_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL UNIQUE REFERENCES chamas(id) ON DELETE CASCADE,
  auto_reminders_enabled BOOLEAN DEFAULT true,
  reminder_frequency VARCHAR(50) DEFAULT '3',
  auto_fines_enabled BOOLEAN DEFAULT false,
  fine_type VARCHAR(50) DEFAULT 'fixed',
  fine_amount DECIMAL(15, 2) DEFAULT 0,
  fine_percentage DECIMAL(5, 2) DEFAULT 0,
  contribution_due_date INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CONTRIBUTION_TRACKING TABLE
CREATE TABLE IF NOT EXISTS contribution_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  expected_amount DECIMAL(15, 2),
  actual_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  is_overdue BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. AUTO_REMINDERS TABLE
CREATE TABLE IF NOT EXISTS auto_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution_tracking_id UUID REFERENCES contribution_tracking(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50),
  message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. AUTO_FINES TABLE
CREATE TABLE IF NOT EXISTS auto_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution_tracking_id UUID REFERENCES contribution_tracking(id) ON DELETE CASCADE,
  fine_amount DECIMAL(15, 2),
  reason VARCHAR(255),
  applied_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. LOAN_REPAYMENTS TABLE
CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  recorded_by UUID,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PART 2: CREATE INDEXES (Copy this second)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_chama_id ON payments(chama_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);

CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting_id ON meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_member_id ON meeting_attendance(member_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_attendance_unique ON meeting_attendance(meeting_id, member_id);

CREATE INDEX IF NOT EXISTS idx_reminders_chama_id ON reminders(chama_id);
CREATE INDEX IF NOT EXISTS idx_reminders_member_id ON reminders(member_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent);

CREATE INDEX IF NOT EXISTS idx_member_wallets_chama_id ON member_wallets(chama_id);
CREATE INDEX IF NOT EXISTS idx_member_wallets_member_id ON member_wallets(member_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_wallets_unique ON member_wallets(chama_id, member_id);

CREATE INDEX IF NOT EXISTS idx_monthly_summary_chama_id ON monthly_contribution_summary(chama_id);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_member_id ON monthly_contribution_summary(member_id);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_month_year ON monthly_contribution_summary(month, year);

CREATE INDEX IF NOT EXISTS idx_automation_settings_chama_id ON automation_settings(chama_id);

CREATE INDEX IF NOT EXISTS idx_contribution_tracking_chama_id ON contribution_tracking(chama_id);
CREATE INDEX IF NOT EXISTS idx_contribution_tracking_member_id ON contribution_tracking(member_id);
CREATE INDEX IF NOT EXISTS idx_contribution_tracking_status ON contribution_tracking(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contribution_tracking_unique ON contribution_tracking(chama_id, member_id, month, year);

CREATE INDEX IF NOT EXISTS idx_auto_reminders_chama_id ON auto_reminders(chama_id);
CREATE INDEX IF NOT EXISTS idx_auto_reminders_member_id ON auto_reminders(member_id);
CREATE INDEX IF NOT EXISTS idx_auto_reminders_sent ON auto_reminders(sent);

CREATE INDEX IF NOT EXISTS idx_auto_fines_chama_id ON auto_fines(chama_id);
CREATE INDEX IF NOT EXISTS idx_auto_fines_member_id ON auto_fines(member_id);
CREATE INDEX IF NOT EXISTS idx_auto_fines_paid ON auto_fines(paid);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan_id ON loan_repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_member_id ON loan_repayments(member_id);

-- ============================================
-- PART 3: ALTER EXISTING TABLES (Copy this third)
-- ============================================

ALTER TABLE fines ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fines ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approved_by UUID;

-- ============================================
-- PART 4: ENABLE RLS & POLICIES (Copy this fourth)
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_contribution_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON payments USING (true);
CREATE POLICY "Service role access" ON meeting_attendance USING (true);
CREATE POLICY "Service role access" ON reminders USING (true);
CREATE POLICY "Service role access" ON member_wallets USING (true);
CREATE POLICY "Service role access" ON monthly_contribution_summary USING (true);
CREATE POLICY "Service role access" ON contribution_insights USING (true);
CREATE POLICY "Service role access" ON automation_settings USING (true);
CREATE POLICY "Service role access" ON contribution_tracking USING (true);
CREATE POLICY "Service role access" ON auto_reminders USING (true);
CREATE POLICY "Service role access" ON auto_fines USING (true);
CREATE POLICY "Service role access" ON loan_repayments USING (true);

-- ============================================
-- DONE! All 11 tables are now created
-- ============================================
