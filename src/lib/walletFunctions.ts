import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

// ============================================
// WALLET FUNCTIONS
// ============================================

export async function getMemberWallet(chamaId: string, memberId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('member_wallets')
    .select('*')
    .eq('chama_id', chamaId)
    .eq('member_id', memberId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllMemberWallets(chamaId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('member_wallets')
    .select(`
      *,
      members:member_id(name, phone, email)
    `)
    .eq('chama_id', chamaId)
    .order('balance', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateMemberWallet(chamaId: string, memberId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('update_member_wallet', {
      p_chama_id: chamaId,
      p_member_id: memberId,
    });

  if (error) throw error;
  return data;
}

// ============================================
// INSIGHTS FUNCTIONS
// ============================================

export async function getTopContributors(chamaId: string, limit: number = 5) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('get_top_contributors', {
      p_chama_id: chamaId,
      p_limit: limit,
    });

  if (error) throw error;
  return data;
}

export async function getDefaulters(chamaId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('get_defaulters', {
      p_chama_id: chamaId,
    });

  if (error) throw error;
  return data || [];
}

export async function getMonthlyStats(chamaId: string, months: number = 12) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('get_monthly_stats', {
      p_chama_id: chamaId,
      p_months: months,
    });

  if (error) throw error;
  return data || [];
}

export async function getMemberContributionRank(chamaId: string, memberId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('get_member_contribution_rank', {
      p_chama_id: chamaId,
      p_member_id: memberId,
    });

  if (error) throw error;
  return data?.[0] || null;
}

// ============================================
// MONTHLY SUMMARY FUNCTIONS
// ============================================

export async function getMonthlyContributionSummary(chamaId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('monthly_contribution_summary')
    .select(`
      *,
      members:member_id(name, phone)
    `)
    .eq('chama_id', chamaId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// INSIGHTS TABLE FUNCTIONS
// ============================================

export async function getContributionInsights(chamaId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('contribution_insights')
    .select(`
      *,
      top_contributor:top_contributor_id(name, phone)
    `)
    .eq('chama_id', chamaId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ============================================
// STATISTICS CALCULATIONS
// ============================================

export async function calculateChamaStatistics(chamaId: string) {
  try {
    const supabase = getSupabaseClient();
    
    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .eq('chama_id', chamaId);

    if (membersError) throw membersError;

    // Update all member wallets
    if (members) {
      for (const member of members) {
        await updateMemberWallet(chamaId, member.id);
      }
    }

    // Get top contributor
    const topContributors = await getTopContributors(chamaId, 1);
    const topContributor = topContributors?.[0];

    // Get all wallets for stats
    const wallets = await getAllMemberWallets(chamaId);

    // Calculate statistics
    const totalMembers = wallets.length;
    const totalContributed = wallets.reduce((sum, w: any) => sum + (w.total_contributed || 0), 0);
    const totalExpected = wallets.length * 5000; // Assuming 5000 as default monthly
    const avgContribution = totalMembers > 0 ? totalContributed / totalMembers : 0;
    const completionRate = totalExpected > 0 ? (totalContributed / totalExpected) * 100 : 0;
    const defaultersCount = wallets.filter((w: any) => w.missed_contributions > 0).length;

    return {
      total_members: totalMembers,
      total_contributed: totalContributed,
      total_expected: totalExpected,
      avg_contribution: avgContribution,
      completion_rate: completionRate,
      top_contributor_id: topContributor?.member_id,
      top_contributor_amount: topContributor?.total_amount,
      defaulters_count: defaultersCount,
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    throw error;
  }
}

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatCurrency(amount: number): string {
  return `KES ${(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function getContributionStatus(actual: number, expected: number): 'paid' | 'partial' | 'missed' {
  if (actual >= expected) return 'paid';
  if (actual > 0) return 'partial';
  return 'missed';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-900 text-green-200';
    case 'partial':
      return 'bg-yellow-900 text-yellow-200';
    case 'missed':
      return 'bg-red-900 text-red-200';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

export function calculateCompletionPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}
