-- Create member_wallets table
CREATE TABLE IF NOT EXISTS member_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) DEFAULT 0,
  total_contributed DECIMAL(12, 2) DEFAULT 0,
  total_expected DECIMAL(12, 2) DEFAULT 0,
  missed_contributions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chama_id, member_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_member_wallets_chama ON member_wallets(chama_id);
CREATE INDEX IF NOT EXISTS idx_member_wallets_member ON member_wallets(member_id);

-- Enable RLS
ALTER TABLE member_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see wallets for their chama
CREATE POLICY "Users can view their chama wallets" ON member_wallets
  FOR SELECT
  USING (
    chama_id IN (
      SELECT id FROM chamas WHERE user_id = auth.uid()
      UNION
      SELECT chama_id FROM members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Only chama owner can update wallets
CREATE POLICY "Only chama owner can update wallets" ON member_wallets
  FOR UPDATE
  USING (
    chama_id IN (SELECT id FROM chamas WHERE user_id = auth.uid())
  );

-- RLS Policy: Only chama owner can insert wallets
CREATE POLICY "Only chama owner can insert wallets" ON member_wallets
  FOR INSERT
  WITH CHECK (
    chama_id IN (SELECT id FROM chamas WHERE user_id = auth.uid())
  );
