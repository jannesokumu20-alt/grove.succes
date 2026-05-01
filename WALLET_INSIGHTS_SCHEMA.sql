-- ============================================
-- WALLET & CONTRIBUTION INSIGHTS SCHEMA
-- For tracking virtual balances and analytics
-- ============================================

-- ============================================
-- 1. MEMBER WALLETS TABLE
-- Virtual balance tracking per member
-- ============================================
CREATE TABLE IF NOT EXISTS member_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) DEFAULT 0,
  total_contributed DECIMAL(15, 2) DEFAULT 0,
  total_borrowed DECIMAL(15, 2) DEFAULT 0,
  missed_contributions INTEGER DEFAULT 0,
  last_contribution_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chama_id, member_id)
);

CREATE INDEX idx_member_wallets_chama_id ON member_wallets(chama_id);
CREATE INDEX idx_member_wallets_member_id ON member_wallets(member_id);
CREATE INDEX idx_member_wallets_balance ON member_wallets(balance);

ALTER TABLE member_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_wallets_chama_access ON member_wallets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = member_wallets.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 2. MONTHLY CONTRIBUTION SUMMARY TABLE
-- For trend tracking and analytics
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_contribution_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  expected_amount DECIMAL(15, 2) NOT NULL,
  actual_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'missed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chama_id, member_id, month, year)
);

CREATE INDEX idx_monthly_summary_chama_id ON monthly_contribution_summary(chama_id);
CREATE INDEX idx_monthly_summary_member_id ON monthly_contribution_summary(member_id);
CREATE INDEX idx_monthly_summary_month_year ON monthly_contribution_summary(month, year);

ALTER TABLE monthly_contribution_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY monthly_summary_chama_access ON monthly_contribution_summary
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = monthly_contribution_summary.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. CONTRIBUTION INSIGHTS TABLE
-- Top contributors, defaulters, trends
-- ============================================
CREATE TABLE IF NOT EXISTS contribution_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL UNIQUE REFERENCES chamas(id) ON DELETE CASCADE,
  total_members INTEGER DEFAULT 0,
  total_contributed DECIMAL(15, 2) DEFAULT 0,
  total_expected DECIMAL(15, 2) DEFAULT 0,
  avg_contribution DECIMAL(15, 2) DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  top_contributor_id UUID REFERENCES members(id) ON DELETE SET NULL,
  top_contributor_amount DECIMAL(15, 2) DEFAULT 0,
  defaulters_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insights_chama_id ON contribution_insights(chama_id);

ALTER TABLE contribution_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY insights_chama_access ON contribution_insights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chamas WHERE chamas.id = contribution_insights.chama_id AND chamas.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS FOR WALLET CALCULATIONS
-- ============================================

-- Update member wallet balance
CREATE OR REPLACE FUNCTION update_member_wallet(
  p_chama_id UUID,
  p_member_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_total_contributions DECIMAL(15, 2);
  v_total_loans DECIMAL(15, 2);
  v_missed_count INTEGER;
  v_last_contribution DATE;
BEGIN
  -- Calculate total contributions
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_contributions
  FROM contributions
  WHERE chama_id = p_chama_id AND member_id = p_member_id;
  
  -- Calculate total loans
  SELECT COALESCE(SUM(COALESCE(amount, 0)), 0)
  INTO v_total_loans
  FROM loans
  WHERE chama_id = p_chama_id AND member_id = p_member_id AND status != 'rejected';
  
  -- Count missed contributions
  SELECT COUNT(*)
  INTO v_missed_count
  FROM contribution_tracking
  WHERE chama_id = p_chama_id 
    AND member_id = p_member_id 
    AND status = 'overdue';
  
  -- Get last contribution date
  SELECT MAX(created_at)::DATE
  INTO v_last_contribution
  FROM contributions
  WHERE chama_id = p_chama_id AND member_id = p_member_id;
  
  -- Insert or update wallet
  INSERT INTO member_wallets (
    chama_id, member_id, balance, total_contributed, total_borrowed, missed_contributions, last_contribution_date
  )
  VALUES (
    p_chama_id, p_member_id, 
    v_total_contributions - v_total_loans,
    v_total_contributions,
    v_total_loans,
    v_missed_count,
    v_last_contribution
  )
  ON CONFLICT (chama_id, member_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    total_contributed = EXCLUDED.total_contributed,
    total_borrowed = EXCLUDED.total_borrowed,
    missed_contributions = EXCLUDED.missed_contributions,
    last_contribution_date = EXCLUDED.last_contribution_date,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Get member contribution rank
CREATE OR REPLACE FUNCTION get_member_contribution_rank(
  p_chama_id UUID,
  p_member_id UUID
)
RETURNS TABLE (
  rank INTEGER,
  total_amount DECIMAL,
  member_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      member_id,
      COALESCE(SUM(amount), 0) as total_amount,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(amount), 0) DESC) as rnk
    FROM contributions
    WHERE chama_id = p_chama_id
    GROUP BY member_id
  )
  SELECT 
    rnk::INTEGER,
    total_amount,
    COUNT(*)::INTEGER OVER () as member_count
  FROM ranked
  WHERE member_id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- Get top contributors
CREATE OR REPLACE FUNCTION get_top_contributors(
  p_chama_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  member_id UUID,
  member_name VARCHAR,
  phone VARCHAR,
  total_amount DECIMAL,
  contribution_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.member_id,
    m.name,
    m.phone,
    COALESCE(SUM(c.amount), 0) as total_amount,
    COUNT(c.id)::INTEGER as contribution_count
  FROM contributions c
  JOIN members m ON c.member_id = m.id
  WHERE c.chama_id = p_chama_id
  GROUP BY c.member_id, m.name, m.phone
  ORDER BY total_amount DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get defaulters (missed contributions)
CREATE OR REPLACE FUNCTION get_defaulters(
  p_chama_id UUID
)
RETURNS TABLE (
  member_id UUID,
  member_name VARCHAR,
  phone VARCHAR,
  missed_count INTEGER,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mw.member_id,
    m.name,
    m.phone,
    mw.missed_contributions,
    mw.balance
  FROM member_wallets mw
  JOIN members m ON mw.member_id = m.id
  WHERE mw.chama_id = p_chama_id AND mw.missed_contributions > 0
  ORDER BY mw.missed_contributions DESC;
END;
$$ LANGUAGE plpgsql;

-- Get monthly contribution stats
CREATE OR REPLACE FUNCTION get_monthly_stats(
  p_chama_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month INTEGER,
  year INTEGER,
  total_expected DECIMAL,
  total_collected DECIMAL,
  completion_rate DECIMAL,
  member_paid_count INTEGER,
  total_members INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      mcs.month,
      mcs.year,
      COALESCE(SUM(mcs.expected_amount), 0) as expected,
      COALESCE(SUM(mcs.actual_amount), 0) as collected,
      COALESCE(SUM(CASE WHEN mcs.status = 'paid' THEN 1 ELSE 0 END), 0) as paid_count,
      COUNT(DISTINCT mcs.member_id) as total
    FROM monthly_contribution_summary mcs
    WHERE mcs.chama_id = p_chama_id 
      AND (mcs.year = EXTRACT(YEAR FROM CURRENT_DATE) 
        OR mcs.year = EXTRACT(YEAR FROM CURRENT_DATE) - 1)
    GROUP BY mcs.month, mcs.year
  )
  SELECT 
    month,
    year,
    expected,
    collected,
    CASE WHEN expected > 0 THEN ROUND((collected / expected * 100)::NUMERIC, 2) ELSE 0 END as rate,
    paid_count,
    total
  FROM monthly_data
  ORDER BY year DESC, month DESC
  LIMIT p_months;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Trigger to update wallet on contribution insert
CREATE OR REPLACE FUNCTION trigger_update_wallet_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_member_wallet(NEW.chama_id, NEW.member_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contribution_wallet
AFTER INSERT ON contributions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_wallet_on_contribution();

-- Trigger to update wallet on loan insert
CREATE OR REPLACE FUNCTION trigger_update_wallet_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_member_wallet(NEW.chama_id, NEW.member_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_loan_wallet
AFTER INSERT ON loans
FOR EACH ROW
EXECUTE FUNCTION trigger_update_wallet_on_loan();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- SELECT * FROM member_wallets;
-- SELECT * FROM monthly_contribution_summary;
-- SELECT * FROM contribution_insights;
-- SELECT * FROM get_top_contributors('chama-id', 5);
-- SELECT * FROM get_defaulters('chama-id');
-- SELECT * FROM get_monthly_stats('chama-id', 12);
