-- ============================================
-- INVITE SYSTEM TABLES
-- ============================================

-- Drop existing tables if needed
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;

-- Create MEMBERS table (fixed schema)
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  credit_score INTEGER DEFAULT 50,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for members
CREATE INDEX idx_members_chama_id ON public.members(chama_id);
CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_members_status ON public.members(status);
CREATE UNIQUE INDEX idx_members_chama_user ON public.members(chama_id, user_id) WHERE user_id IS NOT NULL;

-- Enable RLS on members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owner can see all members of their chama
CREATE POLICY "Owner sees chama members" ON public.members
  FOR SELECT
  USING (
    chama_id IN (SELECT id FROM public.chamas WHERE user_id = auth.uid())
  );

-- RLS Policy: Members can see themselves and other members in same chama
CREATE POLICY "Members see chama members" ON public.members
  FOR SELECT
  USING (
    chama_id IN (SELECT chama_id FROM public.members WHERE user_id = auth.uid())
  );

-- RLS Policy: Owner can update members
CREATE POLICY "Owner updates members" ON public.members
  FOR UPDATE
  USING (
    chama_id IN (SELECT id FROM public.chamas WHERE user_id = auth.uid())
  );

-- RLS Policy: Owner can insert members
CREATE POLICY "Owner inserts members" ON public.members
  FOR INSERT
  WITH CHECK (
    chama_id IN (SELECT id FROM public.chamas WHERE user_id = auth.uid())
  );

-- RLS Policy: Members can update their own record
CREATE POLICY "Members update themselves" ON public.members
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create INVITES table (track sent invitations)
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID NOT NULL REFERENCES public.chamas(id) ON DELETE CASCADE,
  invite_code VARCHAR(8) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'rejected')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  accepted_at TIMESTAMP,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for invites
CREATE INDEX idx_invites_chama_id ON public.invites(chama_id);
CREATE INDEX idx_invites_code ON public.invites(invite_code);
CREATE INDEX idx_invites_email ON public.invites(email);
CREATE INDEX idx_invites_status ON public.invites(status);

-- Enable RLS on invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owner can see invites for their chama
CREATE POLICY "Owner sees chama invites" ON public.invites
  FOR SELECT
  USING (
    chama_id IN (SELECT id FROM public.chamas WHERE user_id = auth.uid())
  );

-- RLS Policy: Owner can create invites
CREATE POLICY "Owner creates invites" ON public.invites
  FOR INSERT
  WITH CHECK (
    chama_id IN (SELECT id FROM public.chamas WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

-- RLS Policy: Owner can update invites
CREATE POLICY "Owner updates invites" ON public.invites
  FOR UPDATE
  USING (
    chama_id IN (SELECT id FROM public.chamas WHERE user_id = auth.uid())
  );

-- Create function to accept invite
CREATE OR REPLACE FUNCTION public.accept_invite(p_invite_code VARCHAR)
RETURNS TABLE(member_id UUID, chama_id UUID) AS $$
DECLARE
  v_invite_id UUID;
  v_chama_id UUID;
  v_user_id UUID;
  v_member_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Find the invite
  SELECT id, chama_id INTO v_invite_id, v_chama_id
  FROM public.invites
  WHERE invite_code = p_invite_code
    AND status = 'pending'
    AND expires_at > NOW()
  LIMIT 1;
  
  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;
  
  -- Check if user already a member of this chama
  SELECT id INTO v_member_id
  FROM public.members
  WHERE chama_id = v_chama_id AND user_id = v_user_id;
  
  IF v_member_id IS NOT NULL THEN
    RAISE EXCEPTION 'Already a member of this chama';
  END IF;
  
  -- Update invite status
  UPDATE public.invites
  SET status = 'accepted', accepted_at = NOW(), accepted_by = v_user_id
  WHERE id = v_invite_id;
  
  RETURN QUERY SELECT v_member_id, v_chama_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
