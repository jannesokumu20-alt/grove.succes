-- ============================================
-- INTELLIGENT AUTOMATION SCHEMA
-- For automatic reminders and fines
-- ============================================

-- ============================================
-- 1. AUTOMATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS automation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL UNIQUE REFERENCES chamas(id) ON DELETE CASCADE,
  auto_reminders_enabled BOOLEAN DEFAULT TRUE,
  auto_fines_enabled BOOLEAN DEFAULT TRUE,
  reminder_before_days INTEGER DEFAULT 3,
  reminder_on_due BOOLEAN DEFAULT TRUE,
  reminder_after_days INTEGER DEFAULT 1,
  fine_type VARCHAR(20) DEFAULT 'fixed' CHECK (fine_type IN ('fixed', 'percentage')),
  fine_amount DECIMAL(10, 2) DEFAULT 500,
  fine_percentage DECIMAL(5, 2) DEFAULT 5,
  max_reminders_per_contribution INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automation_settings_chama_id ON automation_settings(chama_id);

ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY automation_settings_chama_access ON automation_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = automation_settings.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 2. CONTRIBUTION TRACKING TABLE
-- For tracking contribution status and due dates
-- ============================================
CREATE TABLE IF NOT EXISTS contribution_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  due_date DATE NOT NULL,
  expected_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  contribution_id UUID REFERENCES contributions(id) ON DELETE SET NULL,
  overdue_since DATE,
  is_auto_fined BOOLEAN DEFAULT FALSE,
  fine_id UUID REFERENCES fines(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contribution_tracking_chama_id ON contribution_tracking(chama_id);
CREATE INDEX idx_contribution_tracking_member_id ON contribution_tracking(member_id);
CREATE INDEX idx_contribution_tracking_status ON contribution_tracking(status);
CREATE INDEX idx_contribution_tracking_due_date ON contribution_tracking(due_date);
CREATE UNIQUE INDEX idx_contribution_tracking_unique ON contribution_tracking(chama_id, member_id, month, year);

ALTER TABLE contribution_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY contribution_tracking_chama_access ON contribution_tracking
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = contribution_tracking.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. AUTO REMINDERS TABLE
-- For tracking automatically generated reminders
-- ============================================
CREATE TABLE IF NOT EXISTS auto_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution_tracking_id UUID NOT NULL REFERENCES contribution_tracking(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('upcoming', 'due', 'overdue')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auto_reminders_chama_id ON auto_reminders(chama_id);
CREATE INDEX idx_auto_reminders_member_id ON auto_reminders(member_id);
CREATE INDEX idx_auto_reminders_type ON auto_reminders(reminder_type);
CREATE INDEX idx_auto_reminders_scheduled_date ON auto_reminders(scheduled_date);
CREATE INDEX idx_auto_reminders_sent ON auto_reminders(sent);

ALTER TABLE auto_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY auto_reminders_chama_access ON auto_reminders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = auto_reminders.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. AUTO FINES TABLE
-- For tracking automatically applied fines
-- ============================================
CREATE TABLE IF NOT EXISTS auto_fines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution_tracking_id UUID NOT NULL REFERENCES contribution_tracking(id) ON DELETE CASCADE,
  fine_id UUID NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
  base_amount DECIMAL(10, 2) NOT NULL,
  calculated_amount DECIMAL(10, 2) NOT NULL,
  calculation_method VARCHAR(20) CHECK (calculation_method IN ('fixed', 'percentage')),
  percentage_applied DECIMAL(5, 2),
  reason VARCHAR(255) NOT NULL,
  auto_applied BOOLEAN DEFAULT TRUE,
  admin_override BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auto_fines_chama_id ON auto_fines(chama_id);
CREATE INDEX idx_auto_fines_member_id ON auto_fines(member_id);
CREATE INDEX idx_auto_fines_contribution_tracking_id ON auto_fines(contribution_tracking_id);

ALTER TABLE auto_fines ENABLE ROW LEVEL SECURITY;
CREATE POLICY auto_fines_chama_access ON auto_fines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = auto_fines.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS FOR AUTOMATION
-- ============================================

-- Function to get unpaid contributions for a member
CREATE OR REPLACE FUNCTION get_unpaid_contributions(p_member_id UUID)
RETURNS TABLE (
  contribution_id UUID,
  expected_amount DECIMAL,
  paid_amount DECIMAL,
  status VARCHAR,
  due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.contribution_id,
    ct.expected_amount,
    ct.paid_amount,
    ct.status,
    ct.due_date
  FROM contribution_tracking ct
  WHERE ct.member_id = p_member_id 
    AND ct.status IN ('pending', 'partial', 'overdue')
  ORDER BY ct.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate if a contribution is overdue
CREATE OR REPLACE FUNCTION is_contribution_overdue(p_due_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN CURRENT_DATE > p_due_date;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate days until due or days overdue
CREATE OR REPLACE FUNCTION days_from_due(p_due_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN DATE_PART('day', CURRENT_DATE - p_due_date)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to check if reminders should be sent
CREATE OR REPLACE FUNCTION should_send_reminder(
  p_due_date DATE,
  p_reminder_type VARCHAR,
  p_before_days INTEGER,
  p_after_days INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_days_diff INTEGER;
BEGIN
  v_days_diff := DATE_PART('day', CURRENT_DATE - p_due_date)::INTEGER;
  
  CASE p_reminder_type
    WHEN 'upcoming' THEN
      RETURN v_days_diff >= (-p_before_days) AND v_days_diff < 0;
    WHEN 'due' THEN
      RETURN v_days_diff = 0;
    WHEN 'overdue' THEN
      RETURN v_days_diff > 0 AND v_days_diff <= p_after_days;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO AUTO-CREATE CONTRIBUTION TRACKING
-- ============================================
CREATE OR REPLACE FUNCTION create_contribution_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_due_date DATE;
  v_meeting_day_num INTEGER;
BEGIN
  -- Calculate due date based on chama's meeting day
  v_meeting_day_num := (
    SELECT 
      CASE 
        WHEN meeting_day = 'Monday' THEN 1
        WHEN meeting_day = 'Tuesday' THEN 2
        WHEN meeting_day = 'Wednesday' THEN 3
        WHEN meeting_day = 'Thursday' THEN 4
        WHEN meeting_day = 'Friday' THEN 5
        WHEN meeting_day = 'Saturday' THEN 6
        WHEN meeting_day = 'Sunday' THEN 0
        ELSE 1
      END
    FROM chamas WHERE id = NEW.chama_id
  );
  
  -- Set due date to last meeting day of the month
  v_due_date := DATE_TRUNC('month', MAKE_DATE(NEW.year, NEW.month, 1)) + INTERVAL '1 month' - INTERVAL '1 day';
  WHILE EXTRACT(DOW FROM v_due_date) != v_meeting_day_num LOOP
    v_due_date := v_due_date - INTERVAL '1 day';
  END LOOP;
  
  -- Create tracking record if it doesn't exist
  INSERT INTO contribution_tracking 
    (chama_id, member_id, month, year, due_date, expected_amount, paid_amount, status, contribution_id)
  VALUES 
    (NEW.chama_id, NEW.member_id, NEW.month, NEW.year, v_due_date, 
     (SELECT contribution_amount FROM chamas WHERE id = NEW.chama_id),
     NEW.amount, 'paid', NEW.id)
  ON CONFLICT (chama_id, member_id, month, year) DO UPDATE SET
    paid_amount = contribution_tracking.paid_amount + NEW.amount,
    status = CASE 
      WHEN (contribution_tracking.paid_amount + NEW.amount) >= contribution_tracking.expected_amount THEN 'paid'
      WHEN (contribution_tracking.paid_amount + NEW.amount) > 0 THEN 'partial'
      ELSE 'pending'
    END,
    contribution_id = COALESCE(contribution_tracking.contribution_id, NEW.id),
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_contribution_tracking
AFTER INSERT ON contributions
FOR EACH ROW
EXECUTE FUNCTION create_contribution_tracking();

-- ============================================
-- AUTOMATION VERIFICATION
-- ============================================
-- To verify this schema was created successfully, run:
-- SELECT * FROM automation_settings;
-- SELECT * FROM contribution_tracking;
-- SELECT * FROM auto_reminders;
-- SELECT * FROM auto_fines;
