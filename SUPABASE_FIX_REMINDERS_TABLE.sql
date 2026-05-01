-- ============================================
-- FIX REMINDERS TABLE SCHEMA
-- ============================================
-- The reminders table schema doesn't match the code requirements
-- Need to alter the table to add missing columns and adjust structure

-- Drop the old table and recreate with correct schema
DROP TABLE IF EXISTS reminders CASCADE;

-- ============================================
-- RECREATE REMINDERS TABLE WITH CORRECT SCHEMA
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
-- VERIFY THE TABLE STRUCTURE
-- ============================================
-- Run this query to verify:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'reminders' ORDER BY ordinal_position;
