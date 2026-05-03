export interface Chama {
  id: string;
  user_id: string;
  name: string;
  invite_code: string;
  contribution_amount: number;
  meeting_day: string;
  savings_goal: number;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  chama_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  credit_score: number;
  role: 'member' | 'admin' | 'owner';
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  chama_id: string;
  member_id: string;
  amount: number;
  month: number;
  year: number;
  note: string | null;
  recorded_by: string;
  status: 'completed' | 'pending' | 'reversed';
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  chama_id: string;
  member_id: string;
  amount: number;
  balance: number;
  interest_rate: number;
  repayment_months: number;
  monthly_payment: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'active' | 'paid' | 'overdue' | 'defaulted';
  approved_by: string | null;
  approved_at?: string;
  disbursed_at?: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  note?: string;
  recorded_by: string;
  created_at: string;
}

export interface Fine {
  id: string;
  chama_id: string;
  member_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'paid' | 'waived';
  due_date?: string;
  paid_date?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  chama_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  attendance_status: 'present' | 'absent' | 'excused';
  created_at: string;
}

export interface Announcement {
  id: string;
  chama_id: string;
  title: string;
  content: string;
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  chama_id: string;
  title: string;
  description?: string;
  reminder_type: string;
  scheduled_date: string;
  status: 'pending' | 'sent' | 'snoozed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MpesaTransaction {
  id: string;
  chama_id: string;
  member_id: string;
  phone: string;
  amount: number;
  mpesa_code: string | null;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface Share {
  id: string;
  chama_id: string;
  member_id: string;
  share_count: number;
  share_value: number;
  purchased_at: string;
  created_at: string;
}

export interface MemberWallet {
  id: string;
  chama_id: string;
  member_id: string;
  balance: number;
  total_contributed: number;
  total_expected: number;
  missed_contributions: number;
  created_at: string;
  updated_at: string;
}

export interface ContributionPlan {
  id: string;
  chama_id: string;
  name: string;
  description?: string;
  monthly_amount: number;
  collection_frequency: string;
  target_amount?: number;
  status: 'active' | 'paused' | 'completed';
  created_by: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Invite {
  id: string;
  chama_id: string;
  invite_code: string;
  email?: string;
  created_by: string;
  expires_at?: string;
  used: boolean;
  used_by?: string;
  created_at: string;
}

export interface WhatsappLog {
  id: string;
  chama_id: string;
  member_id: string | null;
  direction: 'in' | 'out';
  message: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}
