import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }
    
    const chamaId = request.nextUrl.searchParams.get('chamaId');
    const memberId = request.nextUrl.searchParams.get('memberId');

    if (!chamaId || !memberId) {
      return NextResponse.json(
        { error: 'Chama ID and Member ID are required' },
        { status: 400 }
      );
    }

    // Check if member has contributed this month
    const now = new Date();
    const { data: contributions, error: contributionError } = await supabase
      .from('contributions')
      .select('id')
      .eq('member_id', memberId)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
      .single();

    if (contributionError && contributionError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check contributions' },
        { status: 500 }
      );
    }

    const hasContributedThisMonth = !!contributions;

    // Get member's outstanding loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'approved');

    if (loansError) {
      return NextResponse.json(
        { error: 'Failed to fetch loans' },
        { status: 500 }
      );
    }

    const overdueLoans = loans?.filter((l: any) => {
      const dueDate = new Date(l.due_date);
      return dueDate < now;
    }) || [];

    return NextResponse.json({
      hasContributedThisMonth,
      overdueLoans: overdueLoans.length,
      notifications: {
        contribution: !hasContributedThisMonth,
        overdue: overdueLoans.length > 0,
      },
    });
  } catch (error: any) {
    console.error('Notification check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check notifications' },
      { status: 500 }
    );
  }
}
