-- Create function: get_top_contributors
CREATE OR REPLACE FUNCTION public.get_top_contributors(p_chama_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE(member_id UUID, member_name TEXT, total_amount DECIMAL) AS $$
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

-- Create function: get_defaulters
CREATE OR REPLACE FUNCTION public.get_defaulters(p_chama_id UUID)
RETURNS TABLE(member_id UUID, member_name TEXT, phone TEXT, missed_count INT, last_contribution DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.phone,
    COALESCE(COUNT(DISTINCT DATE_TRUNC('month', NOW())::DATE - INTERVAL '1 month' * generate_series(0, 11)) 
      FILTER (WHERE c.id IS NULL), 0)::INT as missed_count,
    MAX(c.created_at)::DATE as last_contribution
  FROM members m
  LEFT JOIN contributions c ON m.id = c.member_id AND c.chama_id = p_chama_id
  WHERE m.chama_id = p_chama_id AND m.status = 'active'
  GROUP BY m.id, m.name, m.phone
  HAVING COALESCE(COUNT(DISTINCT DATE_TRUNC('month', NOW())::DATE - INTERVAL '1 month' * generate_series(0, 11)) 
    FILTER (WHERE c.id IS NULL), 0) > 0
  ORDER BY missed_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function: get_monthly_stats
CREATE OR REPLACE FUNCTION public.get_monthly_stats(p_chama_id UUID, p_months INT DEFAULT 12)
RETURNS TABLE(month INT, year INT, total_contributed DECIMAL, num_contributors INT, avg_contribution DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(MONTH FROM c.created_at)::INT as month,
    EXTRACT(YEAR FROM c.created_at)::INT as year,
    COALESCE(SUM(c.amount), 0)::DECIMAL as total_contributed,
    COUNT(DISTINCT c.member_id)::INT as num_contributors,
    COALESCE(AVG(c.amount), 0)::DECIMAL as avg_contribution
  FROM contributions c
  WHERE c.chama_id = p_chama_id 
    AND c.created_at >= NOW() - INTERVAL '1 month' * p_months
  GROUP BY EXTRACT(YEAR FROM c.created_at), EXTRACT(MONTH FROM c.created_at)
  ORDER BY year DESC, month DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function: get_member_contribution_rank
CREATE OR REPLACE FUNCTION public.get_member_contribution_rank(p_chama_id UUID, p_member_id UUID)
RETURNS TABLE(rank INT, total_contributed DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      m.id,
      COALESCE(SUM(c.amount), 0)::DECIMAL as total_amount,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC) as member_rank
    FROM members m
    LEFT JOIN contributions c ON m.id = c.member_id AND c.chama_id = p_chama_id
    WHERE m.chama_id = p_chama_id
    GROUP BY m.id
  )
  SELECT 
    member_rank::INT,
    total_amount
  FROM ranked
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- Create function: update_member_wallet
CREATE OR REPLACE FUNCTION public.update_member_wallet(p_chama_id UUID, p_member_id UUID)
RETURNS TABLE(member_id UUID, total_contributed DECIMAL, balance DECIMAL) AS $$
DECLARE
  v_total_contributed DECIMAL;
BEGIN
  -- Calculate total contributions for this member in this chama
  SELECT COALESCE(SUM(amount), 0) INTO v_total_contributed
  FROM contributions
  WHERE chama_id = p_chama_id AND member_id = p_member_id;
  
  -- Return the result
  RETURN QUERY
  SELECT 
    p_member_id as member_id,
    v_total_contributed as total_contributed,
    v_total_contributed as balance;
END;
$$ LANGUAGE plpgsql;
