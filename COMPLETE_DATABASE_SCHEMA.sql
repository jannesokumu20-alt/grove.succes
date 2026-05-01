-- ============================================
-- COMPLETE GROVE DATABASE SCHEMA
-- Matches Frontend Expectations Perfectly
-- ============================================

-- 1. PAYMENTS TABLE (Missing)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_type VARCHAR(50), -- 'loan_repayment', 'contribution'
  payment_method VARCHAR(50), -- 'mpesa', 'bank', 'cash'
  mpesa_code VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_chama_id ON payments(chama_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_loan_id ON payments(loan_id);

-- 2. MEETING_ATTENDANCE TABLE (Missing)
CREATE TABLE IF NOT EXISTS meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT false,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meeting_attendance_meeting_id ON meeting_attendance(meeting_id);
CREATE INDEX idx_meeting_attendance_member_id ON meeting_attendance(member_id);
CREATE UNIQUE INDEX idx_meeting_attendance_unique ON meeting_attendance(meeting_id, member_id);

-- 3. REMINDERS TABLE (Fix Schema)
-- Drop and recreate with correct structure
DROP TABLE IF EXISTS reminders CASCADE;

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE,
  reminder_type VARCHAR(50), -- 'upcoming', 'due', 'overdue'
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_chama_id ON reminders(chama_id);
CREATE INDEX idx_reminders_member_id ON reminders(member_id);
CREATE INDEX idx_reminders_sent ON reminders(sent);

-- 4. MEMBER_WALLETS TABLE (For wallet tracking)
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

CREATE INDEX idx_member_wallets_chama_id ON member_wallets(chama_id);
CREATE INDEX idx_member_wallets_member_id ON member_wallets(member_id);
CREATE UNIQUE INDEX idx_member_wallets_unique ON member_wallets(chama_id, member_id);

-- 5. MONTHLY_CONTRIBUTION_SUMMARY TABLE
CREATE TABLE IF NOT EXISTS monthly_contribution_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  expected_amount DECIMAL(15, 2),
  actual_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50), -- 'paid', 'partial', 'pending', 'overdue'
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_monthly_summary_chama_id ON monthly_contribution_summary(chama_id);
CREATE INDEX idx_monthly_summary_member_id ON monthly_contribution_summary(member_id);
CREATE INDEX idx_monthly_summary_month_year ON monthly_contribution_summary(month, year);

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
  reminder_frequency VARCHAR(50) DEFAULT '3', -- days before due
  auto_fines_enabled BOOLEAN DEFAULT false,
  fine_type VARCHAR(50) DEFAULT 'fixed', -- 'fixed' or 'percentage'
  fine_amount DECIMAL(15, 2) DEFAULT 0,
  fine_percentage DECIMAL(5, 2) DEFAULT 0,
  contribution_due_date INT DEFAULT 1, -- day of month
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_automation_settings_chama_id ON automation_settings(chama_id);

-- 8. CONTRIBUTION_TRACKING TABLE (For automation)
CREATE TABLE IF NOT EXISTS contribution_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  expected_amount DECIMAL(15, 2),
  actual_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  is_overdue BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contribution_tracking_chama_id ON contribution_tracking(chama_id);
CREATE INDEX idx_contribution_tracking_member_id ON contribution_tracking(member_id);
CREATE INDEX idx_contribution_tracking_status ON contribution_tracking(status);
CREATE UNIQUE INDEX idx_contribution_tracking_unique ON contribution_tracking(chama_id, member_id, month, year);

-- 9. AUTO_REMINDERS TABLE
CREATE TABLE IF NOT EXISTS auto_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution_tracking_id UUID REFERENCES contribution_tracking(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50), -- 'upcoming', 'due', 'overdue'
  message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auto_reminders_chama_id ON auto_reminders(chama_id);
CREATE INDEX idx_auto_reminders_member_id ON auto_reminders(member_id);
CREATE INDEX idx_auto_reminders_sent ON auto_reminders(sent);

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

CREATE INDEX idx_auto_fines_chama_id ON auto_fines(chama_id);
CREATE INDEX idx_auto_fines_member_id ON auto_fines(member_id);
CREATE INDEX idx_auto_fines_paid ON auto_fines(paid);

-- 11. FIX FINES TABLE (add missing columns)
ALTER TABLE fines ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fines ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;

-- 12. FIX LOANS TABLE (add missing columns)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 13. LOAN_REPAYMENTS TABLE (for detailed repayment tracking)
CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  recorded_by UUID,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loan_repayments_loan_id ON loan_repayments(loan_id);
CREATE INDEX idx_loan_repayments_member_id ON loan_repayments(member_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update member wallet on contribution insert
CREATE OR REPLACE FUNCTION update_member_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO member_wallets (chama_id, member_id, total_contributed, balance)
  VALUES (NEW.chama_id, NEW.member_id, NEW.amount, NEW.amount)
  ON CONFLICT (chama_id, member_id) DO UPDATE SET
    total_contributed = member_wallets.total_contributed + NEW.amount,
    balance = member_wallets.balance + NEW.amount,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contributions
DROP TRIGGER IF EXISTS trigger_update_wallet_on_contribution ON contributions;
CREATE TRIGGER trigger_update_wallet_on_contribution
AFTER INSERT ON contributions
FOR EACH ROW
EXECUTE FUNCTION update_member_wallet();

-- Function to update member wallet on loan insert
CREATE OR REPLACE FUNCTION update_member_wallet_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO member_wallets (chama_id, member_id, total_borrowed, balance)
  VALUES (NEW.chama_id, NEW.member_id, NEW.amount, -NEW.amount)
  ON CONFLICT (chama_id, member_id) DO UPDATE SET
    total_borrowed = member_wallets.total_borrowed + NEW.amount,
    balance = member_wallets.balance - NEW.amount,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for loans
DROP TRIGGER IF EXISTS trigger_update_wallet_on_loan ON loans;
CREATE TRIGGER trigger_update_wallet_on_loan
AFTER INSERT ON loans
FOR EACH ROW
EXECUTE FUNCTION update_member_wallet_on_loan();

-- ============================================
-- RPC FUNCTIONS FOR AUTOMATION
-- ============================================

CREATE OR REPLACE FUNCTION get_top_contributors(p_chama_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE(
  member_id UUID,
  name VARCHAR,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    COALESCE(SUM(c.amount), 0)::DECIMAL as total_amount
  FROM members m
  LEFT JOIN contributions c ON m.id = c.member_id
  WHERE m.chama_id = p_chama_id
  GROUP BY m.id, m.name
  ORDER BY total_amount DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_defaulters(p_chama_id UUID)
RETURNS TABLE(
  member_id UUID,
  name VARCHAR,
  missed_contributions INT,
  total_missed DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    COUNT(CASE WHEN ct.status = 'pending' OR ct.status = 'overdue' THEN 1 END)::INT,
    COALESCE(SUM(ct.expected_amount), 0)::DECIMAL
  FROM members m
  LEFT JOIN contribution_tracking ct ON m.id = ct.member_id AND ct.status IN ('pending', 'overdue')
  WHERE m.chama_id = p_chama_id
  GROUP BY m.id, m.name
  HAVING COUNT(CASE WHEN ct.status = 'pending' OR ct.status = 'overdue' THEN 1 END) > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthly_stats(p_chama_id UUID, p_months INT DEFAULT 12)
RETURNS TABLE(
  month INT,
  year INT,
  expected_total DECIMAL,
  actual_total DECIMAL,
  completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mcs.month,
    mcs.year,
    SUM(mcs.expected_amount)::DECIMAL,
    SUM(mcs.actual_amount)::DECIMAL,
    CASE 
      WHEN SUM(mcs.expected_amount) = 0 THEN 0
      ELSE ROUND((SUM(mcs.actual_amount) / SUM(mcs.expected_amount)) * 100, 2)::DECIMAL
    END
  FROM monthly_contribution_summary mcs
  WHERE mcs.chama_id = p_chama_id
  GROUP BY mcs.month, mcs.year
  ORDER BY mcs.year DESC, mcs.month DESC
  LIMIT p_months;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_member_contribution_rank(p_chama_id UUID, p_member_id UUID)
RETURNS TABLE(
  rank INT,
  total_contributed DECIMAL,
  member_count INT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_members AS (
    SELECT 
      m.id,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC) as rnk,
      COALESCE(SUM(c.amount), 0)::DECIMAL as total
    FROM members m
    LEFT JOIN contributions c ON m.id = c.member_id
    WHERE m.chama_id = p_chama_id
    GROUP BY m.id
  )
  SELECT 
    rm.rnk::INT,
    rm.total::DECIMAL,
    COUNT(*)::INT OVER ()
  FROM ranked_members rm
  WHERE rm.id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENABLE RLS (Row Level Security)
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

-- RLS Policies (Allow all for service role)
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
