import { createClient } from '@supabase/supabase-js';
import type {
  Chama,
  Member,
  Contribution,
  Loan,
  LoanRepayment,
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a singleton Supabase client
let supabaseClient: any = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

// Create a dummy client that handles missing configuration gracefully
export const supabase = getSupabaseClient();

// ============================================
// AUTHENTICATION
// ============================================

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ============================================
// CHAMA OPERATIONS
// ============================================

export async function createChama(
  userId: string,
  name: string,
  inviteCode: string,
  contributionAmount: number,
  meetingDay: string,
  savingsGoal: number
) {
  const { data, error } = await supabase
    .from('chamas')
    .insert([
      {
        user_id: userId,
        name,
        invite_code: inviteCode,
        contribution_amount: contributionAmount,
        meeting_day: meetingDay,
        savings_goal: savingsGoal,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Chama;
}

export async function getChama(chamaId: string) {
  const { data, error } = await supabase
    .from('chamas')
    .select('*')
    .eq('id', chamaId)
    .single();

  if (error) throw error;
  return data as Chama;
}

export async function getChamaByInviteCode(inviteCode: string) {
  const { data, error } = await supabase
    .from('chamas')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Chama | null;
}

export async function getUserChama(userId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('chamas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Code PGRST116 means no rows found - that's OK for new users
      if (error.code !== 'PGRST116') {
        console.error('Error fetching chama:', error);
        throw error;
      }
      return null;
    }
    return data as Chama | null;
  } catch (error: any) {
    console.error('getUserChama error:', error.message);
    throw error;
  }
}

export async function updateChama(chamaId: string, updates: Partial<Chama>) {
  const { data, error } = await supabase
    .from('chamas')
    .update(updates)
    .eq('id', chamaId)
    .select()
    .single();

  if (error) throw error;
  return data as Chama;
}

// ============================================
// MEMBER OPERATIONS
// ============================================

export async function addMember(
  chamaId: string,
  fullName: string,
  phone: string,
  userId?: string
) {
  // Validate required fields
  if (!fullName || !fullName.trim()) {
    throw new Error('Full name is required and cannot be empty');
  }
  if (!phone || !phone.trim()) {
    throw new Error('Phone number is required and cannot be empty');
  }

  const { data, error } = await supabase
    .from('members')
    .insert([
      {
        chama_id: chamaId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        user_id: userId || null,
        status: 'active',
        credit_score: 50,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Member;
}

export async function getMembers(chamaId: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('chama_id', chamaId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Member[];
}

export async function getMember(memberId: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error) throw error;
  return data as Member;
}

export async function updateMember(memberId: string, updates: Partial<Member>) {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data as Member;
}

export async function getMemberByEmailAndPhone(email: string, phone: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error) return null;
  return data as Member | null;
}

// ============================================
// CONTRIBUTION OPERATIONS
// ============================================

export async function recordContribution(
  chamaId: string,
  memberId: string,
  amount: number,
  month: number,
  year: number,
  recordedBy: string,
  note?: string
) {
  try {
    // Use upsert to handle duplicate contributions for same member in same month/year
    const { data, error } = await supabase
      .from('contributions')
      .upsert([
        {
          chama_id: chamaId,
          member_id: memberId,
          amount,
          month,
          year,
          note: note || null,
          recorded_by: recordedBy || '',
        },
      ], {
        onConflict: 'chama_id,member_id,month,year'
      })
      .select()
      .single();

    if (error) throw error;
    return data as Contribution;
  } catch (err: any) {
    console.error('recordContribution error:', err);
    throw err;
  }
}

export async function getInviteByCode(code: string) {
  try {
    const { data, error } = await supabase
      .from('chamas')
      .select('*')
      .eq('invite_code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Chama | null;
  } catch (err: any) {
    console.error('getInviteByCode error:', err);
    return null;
  }
}

export async function useInviteCode(
  chamaId: string,
  fullName: string,
  phone: string,
  userId?: string
) {
  try {
    // Add member to chama using invite code
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .insert([
        {
          chama_id: chamaId,
          name: fullName,
          phone,
          user_id: userId || null,
          status: 'active',
          credit_score: 50,
        },
      ])
      .select()
      .single();

    if (memberError) throw memberError;

    return memberData as Member;
  } catch (err: any) {
    console.error('useInviteCode error:', err);
    throw err;
  }
}

export async function generateInviteLink(
  chamaId: string,
  userId: string
) {
  try {
    // Get existing chama invite code
    const { data: chamaData, error: chamaError } = await supabase
      .from('chamas')
      .select('invite_code')
      .eq('id', chamaId)
      .single();

    if (chamaError) throw chamaError;
    
    const code = chamaData?.invite_code || generateRandomCode();
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${code}`;
    
    return { code, link };
  } catch (err: any) {
    console.error('generateInviteLink error:', err);
    throw err;
  }
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getContributions(chamaId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select(`*, members(name, phone)`)
    .eq('chama_id', chamaId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function getContributionsByMember(memberId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Contribution[];
}

export async function getContributionsByMonthYear(
  chamaId: string,
  month: number,
  year: number
) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('chama_id', chamaId)
    .eq('month', month)
    .eq('year', year)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Contribution[];
}

// ============================================
// LOAN OPERATIONS
// ============================================

export async function createLoan(
  chamaId: string,
  memberId: string,
  amount: number,
  interestRate: number,
  repaymentMonths: number,
  monthlyPayment: number,
  dueDate: string,
  reason?: string
) {
  const { data, error } = await supabase
    .from('loans')
    .insert([
      {
        chama_id: chamaId,
        member_id: memberId,
        amount,
        balance: amount,
        interest_rate: interestRate,
        repayment_months: repaymentMonths,
        monthly_payment: monthlyPayment,
        reason: reason || null,
        due_date: dueDate,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Loan;
}

export async function getLoans(chamaId: string) {
  const { data, error } = await supabase
    .from('loans')
    .select(`*, members(name, phone)`)
    .eq('chama_id', chamaId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function approveLoan(loanId: string, approvedBy: string) {
  const { data, error } = await supabase
    .from('loans')
    .update({ status: 'approved', approved_by: approvedBy })
    .eq('id', loanId)
    .select()
    .single();

  if (error) throw error;
  return data as Loan;
}

export async function declineLoan(loanId: string) {
  const { data, error } = await supabase
    .from('loans')
    .delete()
    .eq('id', loanId);

  if (error) throw error;
  return data;
}

export async function recordLoanRepayment(
  loanId: string,
  memberId: string,
  amount: number,
  recordedBy: string
) {
  // Get the current loan
  const loan = await supabase
    .from('loans')
    .select('balance')
    .eq('id', loanId)
    .single();

  if (loan.error) throw loan.error;

  const newBalance = Math.max(0, loan.data.balance - amount);

  // Record repayment
  const { data: repaymentData, error: repaymentError } = await supabase
    .from('loan_repayments')
    .insert([
      {
        loan_id: loanId,
        member_id: memberId,
        amount,
        recorded_by: recordedBy,
      },
    ])
    .select()
    .single();

  if (repaymentError) throw repaymentError;

  // Update loan balance
  const { data: updatedLoan, error: updateError } = await supabase
    .from('loans')
    .update({ balance: newBalance })
    .eq('id', loanId)
    .select()
    .single();

  if (updateError) throw updateError;

  return { repayment: repaymentData, loan: updatedLoan };
}

// ============================================
// STATISTICS
// ============================================

export async function getChamaStats(chamaId: string) {
  try {
    // Total savings
    const { data: contributions } = await supabase
      .from('contributions')
      .select('amount')
      .eq('chama_id', chamaId);

    const totalSavings = contributions?.reduce(
      (sum: number, c: any) => sum + (c.amount || 0),
      0
    ) || 0;

    // Active loans
    const { data: loans } = await supabase
      .from('loans')
      .select('balance, status')
      .eq('chama_id', chamaId)
      .eq('status', 'approved');

    const activeLoanBalance =
      loans?.reduce((sum: number, l: any) => sum + (l.balance || 0), 0) || 0;
    const activeLoanCount = loans?.length || 0;

    // Total loans count (all loans regardless of status)
    const { data: allLoans } = await supabase
      .from('loans')
      .select('id')
      .eq('chama_id', chamaId);

    const totalLoansCount = allLoans?.length || 0;

    // Members
    const { data: members } = await supabase
      .from('members')
      .select('id')
      .eq('chama_id', chamaId);

    const memberCount = members?.length || 0;

    // This month contributions
    const now = new Date();
    const { data: thisMonthContributions } = await supabase
      .from('contributions')
      .select('amount')
      .eq('chama_id', chamaId)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear());

    const thisMonthTotal =
      thisMonthContributions?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;

    return {
      totalSavings,
      activeLoanBalance,
      activeLoanCount,
      totalLoansCount,
      memberCount,
      thisMonthTotal,
    };
  } catch (error) {
    console.error('Error getting chama stats:', error);
    return {
      totalSavings: 0,
      activeLoanBalance: 0,
      activeLoanCount: 0,
      totalLoansCount: 0,
      memberCount: 0,
      thisMonthTotal: 0,
    };
  }
}

export async function getMembersNotContributedThisMonth(chamaId: string) {
  const now = new Date();
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('chama_id', chamaId)
    .not(
      'id',
      'in',
      `(
        SELECT member_id FROM contributions
        WHERE chama_id = '${chamaId}'
        AND month = ${now.getMonth() + 1}
        AND year = ${now.getFullYear()}
      )`
    );

  if (error) throw error;
  return data as Member[];
}

// ============================================
// FINES OPERATIONS
// ============================================

export async function createFine(
  chamaId: string,
  memberId: string,
  reason: string,
  amount: number
) {
  const { data, error } = await supabase
    .from('fines')
    .insert([
      {
        chama_id: chamaId,
        member_id: memberId,
        reason,
        amount,
        paid: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function getFines(chamaId: string) {
  const { data, error } = await supabase
    .from('fines')
    .select(`*, members(name, phone)`)
    .eq('chama_id', chamaId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function payFine(fineId: string) {
  const { data, error } = await supabase
    .from('fines')
    .update({
      paid: true,
      paid_at: new Date().toISOString(),
    })
    .eq('id', fineId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function deleteFine(fineId: string) {
  const { error } = await supabase.from('fines').delete().eq('id', fineId);

  if (error) throw error;
}

// ============================================
// MEETINGS OPERATIONS
// ============================================

export async function createMeeting(
  chamaId: string,
  date: string,
  time?: string,
  location?: string,
  agenda?: string
) {
  const { data, error } = await supabase
    .from('meetings')
    .insert([
      {
        chama_id: chamaId,
        date,
        time: time || null,
        location: location || null,
        agenda: agenda || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function getMeetings(chamaId: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('chama_id', chamaId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function getMeeting(meetingId: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (error) throw error;
  return data as any;
}

export async function recordAttendance(
  meetingId: string,
  memberId: string,
  attended: boolean
) {
  const { data, error } = await supabase
    .from('meeting_attendance')
    .insert([
      {
        meeting_id: meetingId,
        member_id: memberId,
        attended,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function getAttendance(meetingId: string) {
  const { data, error } = await supabase
    .from('meeting_attendance')
    .select(`*, members(name, phone)`)
    .eq('meeting_id', meetingId);

  if (error) throw error;
  return data as any[];
}

export async function deleteMeeting(meetingId: string) {
  // Delete attendance records first
  await supabase.from('meeting_attendance').delete().eq('meeting_id', meetingId);
  
  // Delete meeting
  const { error } = await supabase.from('meetings').delete().eq('id', meetingId);

  if (error) throw error;
}

// ============================================
// ANNOUNCEMENTS OPERATIONS
// ============================================

export async function createAnnouncement(
  chamaId: string,
  title: string,
  content: string
) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([
      {
        chama_id: chamaId,
        title,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function getAnnouncements(chamaId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('chama_id', chamaId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function deleteAnnouncement(announcementId: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId);

  if (error) throw error;
}

// ============================================
// REMINDERS OPERATIONS
// ============================================

export async function createReminder(
  chamaId: string,
  title: string,
  message: string,
  reminderDate: string
) {
  const { data, error } = await supabase
    .from('reminders')
    .insert([
      {
        chama_id: chamaId,
        title,
        message,
        reminder_date: reminderDate,
        sent: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function getReminders(chamaId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('chama_id', chamaId)
    .order('reminder_date', { ascending: true });

  if (error) throw error;
  return data as any[];
}

export async function deleteReminder(reminderId: string) {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId);

  if (error) throw error;
}

export async function sendReminder(reminderId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .update({
      sent: true,
      sent_at: new Date().toISOString(),
    })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

