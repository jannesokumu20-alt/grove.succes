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
  status: 'active' | 'inactive' | 'suspended';
  credit_score: number;
  joined_at: string;
  created_at: string;
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
  created_at: string;
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
  status: 'pending' | 'approved' | 'paid' | 'overdue';
  approved_by: string | null;
  due_date: string | null;
  created_at: string;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  member_id: string;
  amount: number;
  paid_at: string;
  recorded_by: string;
  created_at: string;
}

export interface Fine {
  id: string;
  chama_id: string;
  member_id: string;
  reason: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  chama_id: string;
  date: string;
  time: string | null;
  location: string | null;
  agenda: string | null;
  created_at: string;
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  attended: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  chama_id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  chama_id: string;
  message: string;
  sent_to_count: number;
  sent_by: string;
  sent_at: string;
  created_at: string;
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
