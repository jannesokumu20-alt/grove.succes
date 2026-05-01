-- ============================================
-- GROVE DATABASE SCHEMA - V1 COMPLETE
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CHAMAS TABLE
-- ============================================
CREATE TABLE chamas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(8) NOT NULL UNIQUE,
  contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  meeting_day VARCHAR(20),
  savings_goal DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chamas_user_id ON chamas(user_id);
CREATE INDEX idx_chamas_invite_code ON chamas(invite_code);

-- RLS: Users can only see their own chama
ALTER TABLE chamas ENABLE ROW LEVEL SECURITY;
CREATE POLICY chama_owner_policy ON chamas
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. MEMBERS TABLE
-- ============================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  credit_score INTEGER DEFAULT 50,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_members_chama_id ON members(chama_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE UNIQUE INDEX idx_members_chama_phone ON members(chama_id, phone);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_chama_access ON members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = members.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. CONTRIBUTIONS TABLE
-- ============================================
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  note TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contributions_chama_id ON contributions(chama_id);
CREATE INDEX idx_contributions_member_id ON contributions(member_id);
CREATE INDEX idx_contributions_month_year ON contributions(month, year);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY contributions_chama_access ON contributions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = contributions.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. LOANS TABLE
-- ============================================
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 10.00,
  repayment_months INTEGER NOT NULL DEFAULT 12,
  monthly_payment DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'overdue')),
  approved_by UUID REFERENCES auth.users(id),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_chama_id ON loans(chama_id);
CREATE INDEX idx_loans_member_id ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY loans_chama_access ON loans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = loans.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. LOAN REPAYMENTS TABLE
-- ============================================
CREATE TABLE loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loan_repayments_loan_id ON loan_repayments(loan_id);
CREATE INDEX idx_loan_repayments_member_id ON loan_repayments(member_id);

ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
CREATE POLICY loan_repayments_chama_access ON loan_repayments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM loans
      JOIN chamas ON chamas.id = loans.chama_id
      WHERE loans.id = loan_repayments.loan_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. FINES TABLE
-- ============================================
CREATE TABLE fines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fines_chama_id ON fines(chama_id);
CREATE INDEX idx_fines_member_id ON fines(member_id);

ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
CREATE POLICY fines_chama_access ON fines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = fines.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. MEETINGS TABLE
-- ============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(255),
  agenda TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_chama_id ON meetings(chama_id);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY meetings_chama_access ON meetings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = meetings.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. MEETING ATTENDANCE TABLE
-- ============================================
CREATE TABLE meeting_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meeting_attendance_meeting_id ON meeting_attendance(meeting_id);
CREATE INDEX idx_meeting_attendance_member_id ON meeting_attendance(member_id);

ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY meeting_attendance_chama_access ON meeting_attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN chamas ON chamas.id = meetings.chama_id
      WHERE meetings.id = meeting_attendance.meeting_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 9. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_chama_id ON announcements(chama_id);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY announcements_chama_access ON announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = announcements.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. REMINDERS TABLE
-- ============================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reminder_date TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_chama_id ON reminders(chama_id);
CREATE INDEX idx_reminders_reminder_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_sent ON reminders(sent);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_chama_access ON reminders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = reminders.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 11. MPESA TRANSACTIONS TABLE
-- ============================================
CREATE TABLE mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  mpesa_code VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mpesa_transactions_chama_id ON mpesa_transactions(chama_id);
CREATE INDEX idx_mpesa_transactions_status ON mpesa_transactions(status);

ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY mpesa_transactions_chama_access ON mpesa_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = mpesa_transactions.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 12. SHARES TABLE (SACCO MODE)
-- ============================================
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  share_count INTEGER NOT NULL DEFAULT 1,
  share_value DECIMAL(10, 2) NOT NULL DEFAULT 1000,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shares_chama_id ON shares(chama_id);
CREATE INDEX idx_shares_member_id ON shares(member_id);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY shares_chama_access ON shares
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = shares.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 13. WHATSAPP LOGS TABLE
-- ============================================
CREATE TABLE whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  direction VARCHAR(3) CHECK (direction IN ('in', 'out')),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_logs_chama_id ON whatsapp_logs(chama_id);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_logs_chama_access ON whatsapp_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = whatsapp_logs.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate credit score for member
CREATE OR REPLACE FUNCTION calculate_credit_score(member_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 50;
  contribution_count INTEGER;
  loan_repayment_rate DECIMAL;
  fine_count INTEGER;
BEGIN
  -- Count contributions
  SELECT COUNT(*) INTO contribution_count FROM contributions WHERE contributions.member_id = $1;
  score := score + (contribution_count * 2);
  
  -- Check loan repayment rate
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE (COUNT(CASE WHEN loan_repayments.id IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100
    END INTO loan_repayment_rate
  FROM loans
  LEFT JOIN loan_repayments ON loans.id = loan_repayments.loan_id
  WHERE loans.member_id = $1;
  
  score := score + FLOOR((loan_repayment_rate / 100) * 20);
  
  -- Check fines
  SELECT COUNT(*) INTO fine_count FROM fines WHERE fines.member_id = $1 AND fines.paid = FALSE;
  score := score - (fine_count * 5);
  
  -- Cap between 0 and 100
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;

-- Auto-update loan status
CREATE OR REPLACE FUNCTION update_loan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If balance is 0, mark as paid
  IF NEW.balance <= 0 THEN
    NEW.status := 'paid';
  -- If due date has passed and balance > 0, mark as overdue
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.status != 'paid' THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loan_status_trigger
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_loan_status();

-- ============================================
-- SEED DATA (Optional - Remove in production)
-- ============================================

-- You can add sample data here for testing

COMMIT;
