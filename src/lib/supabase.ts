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

function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[\s\-()]/g, '');
  // Handle +254 format (convert to 0-based)
  if (normalized.startsWith('+254')) {
    normalized = '0' + normalized.slice(4);
  }
  return normalized;
}

function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const normalized = normalizePhone(phone);
  // Kenyan format: 0701234567 (0 + 9 digits) or 254701234567 (country code + 9 digits)
  const kenyanRegex = /^0[0-9]{9}$/;
  return kenyanRegex.test(normalized);
}

function validateFullName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  // At least 2 characters, not just whitespace
  return trimmed.length >= 2;
}

function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  // At least 6 chars, has letters and numbers
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

function generateUniqueEmail(phone: string): string {
  // Use UUID to ensure uniqueness since we can't use phone@grove.local
  const timestamp = Date.now();
  return `auth+${normalizePhone(phone)}_${timestamp}@grove.app`;
}

export async function signUpWithPhone(
  phone: string,
  password: string,
  fullName: string
) {
  // Validate and normalize inputs
  const trimmedName = fullName?.trim() || '';
  const trimmedPhone = phone?.trim() || '';
  const trimmedPassword = password?.trim() || '';

  // Validate full name (issue #33, #34, #75)
  if (!validateFullName(trimmedName)) {
    throw new Error('Full name must be at least 2 characters');
  }

  // Validate phone (issue #29, #30, #44)
  if (!trimmedPhone) {
    throw new Error('Phone number is required');
  }

  if (!validatePhone(trimmedPhone)) {
    throw new Error('Please enter a valid Kenyan phone number (e.g., 0701234567 or +254701234567)');
  }

  // Validate password (issue #31)
  if (!validatePassword(trimmedPassword)) {
    throw new Error('Password must be at least 6 characters with letters and numbers');
  }

  const normalizedPhone = normalizePhone(trimmedPhone);
  const uniqueEmail = generateUniqueEmail(trimmedPhone);

  try {
    // Check if phone already exists (issue #8, #23)
    const { data: existingUser, error: checkError } = await supabase
      .from('members')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error('Failed to check existing account');
    }

    if (existingUser) {
      throw new Error('This phone number is already registered');
    }

    // Create auth user with unique email
    const { data, error } = await supabase.auth.signUp({
      email: uniqueEmail,
      password: trimmedPassword,
      options: {
        data: {
          phone: normalizedPhone,
          full_name: trimmedName,
        },
      },
    });

    if (error) {
      // Handle specific auth errors (issue #46)
      if (error.message?.includes('already registered')) {
        throw new Error('This account already exists. Please sign in instead.');
      }
      if (error.message?.includes('weak password')) {
        throw new Error('Password is too weak. Use letters and numbers.');
      }
      throw new Error(`Sign up failed: ${error.message}`);
    }

    if (!data?.user?.id) {
      throw new Error('Failed to create user account. Please try again.');
    }

    if (!data?.session) {
      // Some auth flows require email verification, still return user for member creation
      console.warn('[signUpWithPhone] No immediate session (may require verification)');
    }

    return data;
  } catch (err: any) {
    console.error('[signUpWithPhone] Error:', err.message || err);
    throw err;
  }
}

export async function signInWithPhone(phone: string, password: string) {
  const trimmedPhone = phone?.trim() || '';
  const trimmedPassword = password?.trim() || '';

  // Validate inputs (issue #29, #35, #45)
  if (!trimmedPhone) {
    throw new Error('Phone number is required');
  }

  if (!validatePhone(trimmedPhone)) {
    throw new Error('Please enter a valid Kenyan phone number (e.g., 0701234567 or +254701234567)');
  }

  if (!trimmedPassword) {
    throw new Error('Password is required');
  }

  const normalizedPhone = normalizePhone(trimmedPhone);

  try {
    // Verify that a member with this phone exists
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('id, user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('[signInWithPhone] Member lookup error:', memberError);
      throw new Error('Failed to verify account. Please try again.');
    }

    if (!memberData) {
      throw new Error('Phone number not found. Please sign up first.');
    }

    // Generate the email that was used during signup
    // Supabase Auth holds the real password, so we use Supabase Auth to validate it
    const authEmail = generateUniqueEmail(trimmedPhone);

    // Sign in with Supabase Auth using the generated email
    // This is the ONLY place we validate the password - through Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: trimmedPassword,
    });

    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Incorrect password. Please try again.');
      }
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please confirm your email before signing in.');
      }
      console.error('[signInWithPhone] Auth error:', error);
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!data?.session) {
      throw new Error('Failed to create session. Please try again.');
    }

    return data;
  } catch (err: any) {
    console.error('[signInWithPhone] Error:', err.message || err);
    throw err;
  }
}

export async function getMemberByUserId(userId: string) {
  if (!userId || typeof userId !== 'string') {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // PGRST116 = no rows found, which is fine
      if (error.code === 'PGRST116') {
        return null;
      }
      
      // Log other errors with full context (issue #17)
      console.error('[getMemberByUserId] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Return null to allow graceful degradation
      return null;
    }

    if (!data) {
      return null;
    }

    return data as Member;
  } catch (err: any) {
    console.error('[getMemberByUserId] Exception:', {
      message: err.message,
      stack: err.stack,
    });
    return null;
  }
}

export async function createMemberFromSignUp(
  userId: string,
  fullName: string,
  phone: string,
  email?: string,
  inviteCode?: string
) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID is required');
  }

  const trimmedName = fullName?.trim() || '';
  const trimmedPhone = phone?.trim() || '';
  const trimmedEmail = email?.trim() || '';
  const trimmedCode = inviteCode?.trim() || '';
  const normalizedPhone = normalizePhone(trimmedPhone);

  // Validate full name (issue #33, #34, #75)
  if (!validateFullName(trimmedName)) {
    throw new Error('Full name must be at least 2 characters');
  }

  if (!normalizedPhone) {
    throw new Error('Phone number is required');
  }

  try {
    // Check if member already exists for this user (issue #5)
    const { data: existingMember, error: existingError } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error('Failed to check existing account');
    }

    if (existingMember) {
      throw new Error('Member profile already exists for this user');
    }

    let chamaId: string | null = null;

    // Handle invite code if provided (issue #35, #36, #80)
    if (trimmedCode && trimmedCode.length > 0) {
      const normalizedCode = trimmedCode.toUpperCase();
      
      const { data: chama, error: chamaError } = await supabase
        .from('chamas')
        .select('id')
        .eq('invite_code', normalizedCode)
        .maybeSingle();

      if (chamaError && chamaError.code !== 'PGRST116') {
        throw new Error('Failed to validate invite code');
      }

      if (!chama) {
        throw new Error('Invalid invite code. Please check and try again.');
      }

      chamaId = chama.id;
    } else {
      // If no invite code, create a default personal chama for the user
      // chama_id is NOT NULL in schema, so we must provide one
      console.log('[createMemberFromSignUp] No invite code provided, creating personal chama...');
      
      const personalChamaName = `${trimmedName}'s Personal Chama`;
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Start with full payload including optional fields
      const chamaPayload: any = {
        user_id: userId,
        name: personalChamaName,
        invite_code: randomCode,
        contribution_amount: 0,
        savings_goal: 0,
        status: 'active',
      };
      
      console.log('[createMemberFromSignUp] Creating chama with payload:', {
        user_id: userId,
        name: personalChamaName,
        invite_code: randomCode,
      });
      
      let newChama: any = null;
      let chamaCreateError: any = null;
      
      // Try with full payload first
      const result1 = await supabase
        .from('chamas')
        .insert([chamaPayload])
        .select('id')
        .single();
      
      newChama = result1.data;
      chamaCreateError = result1.error;
      
      // If schema cache error on optional fields, retry with minimal required fields
      if (chamaCreateError && (
        chamaCreateError.message?.includes('schema cache') || 
        chamaCreateError.message?.includes('status') ||
        chamaCreateError.message?.includes('contribution_amount') ||
        chamaCreateError.message?.includes('savings_goal')
      )) {
        console.log('[createMemberFromSignUp] Schema cache delay detected, retrying with minimal fields...');
        
        // Retry with only absolutely required fields
        const minimalPayload = {
          user_id: userId,
          name: personalChamaName,
          invite_code: randomCode,
        };
        
        const result2 = await supabase
          .from('chamas')
          .insert([minimalPayload])
          .select('id')
          .single();
        
        newChama = result2.data;
        chamaCreateError = result2.error;
        
        if (!chamaCreateError) {
          console.log('[createMemberFromSignUp] Retry succeeded - chama created with defaults');
        }
      }
      
      if (chamaCreateError) {
        console.error('[createMemberFromSignUp] Chama creation failed:', {
          message: chamaCreateError.message,
          code: chamaCreateError.code,
          details: chamaCreateError.details,
          hint: chamaCreateError.hint,
        });
        
        // If RLS policy blocks creation
        if (chamaCreateError.message?.includes('policy') || chamaCreateError.code === 'PGRST301') {
          console.log('[createMemberFromSignUp] RLS policy may be blocking chama creation...');
          throw new Error('Permission denied: Unable to create chama. Please try again or contact support.');
        }
        
        throw new Error(`Failed to create user profile - could not initialize chama: ${chamaCreateError.message}`);
      }
      
      if (!newChama?.id) {
        console.error('[createMemberFromSignUp] Chama created but no ID returned:', newChama);
        throw new Error('Personal chama was not created properly');
      }
      
      chamaId = newChama.id;
      console.log('[createMemberFromSignUp] Personal chama created successfully:', chamaId);
    }

    // Prepare member record - email is optional (will be added via migration)
    const memberData: any = {
      user_id: userId,
      name: trimmedName,
      phone: normalizedPhone,
      chama_id: chamaId,
      status: 'active',
      role: 'member',
      credit_score: 50,
    };

    // Add email if provided
    if (trimmedEmail) {
      memberData.email = trimmedEmail;
    }

    // Create member record with all required fields (issue #39, #40, #41, #43, #44)
    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single();

    if (error) {
      console.error('[createMemberFromSignUp] Database insert error:', error.message);
      
      // Handle missing schema cache columns (email, role, status)
      // Supabase schema cache may not be immediately updated
      const errorMsg = error.message?.toLowerCase() || '';
      const hasMissingColumn = errorMsg.includes('email') || 
                                errorMsg.includes('role') || 
                                errorMsg.includes('status');
      
      if (hasMissingColumn) {
        console.log('[createMemberFromSignUp] Schema cache delay detected, retrying with minimal fields...');
        
        // Try with only absolutely required fields
        const minimalData = {
          user_id: userId,
          name: trimmedName,
          phone: normalizedPhone,
          chama_id: chamaId,
        };
        
        const { data: retryData, error: retryError } = await supabase
          .from('members')
          .insert([minimalData])
          .select()
          .single();
        
        if (retryError) {
          throw new Error(`Failed to create user profile: ${retryError.message}`);
        }
        
        if (!retryData?.id) {
          throw new Error('Member profile was not created properly');
        }

        console.warn('[createMemberFromSignUp] Schema cache delay handled. Some fields may need migration.');
        console.warn('  - Run ADD_EMAIL_TO_MEMBERS.sql to enable email storage');
        console.warn('  - Role and status will use database defaults');
        return retryData as Member;
      }
      
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('Member profile was not created properly');
    }

    // Create member_wallets entry if it exists (issue #42)
    try {
      const { error: walletError } = await supabase
        .from('member_wallets')
        .insert([
          {
            member_id: data.id,
            balance: 0,
            currency: 'KES',
          },
        ]);

      if (walletError && walletError.code !== 'PGRST116') {
        console.warn('[createMemberFromSignUp] Wallet creation warning:', walletError.message);
      }
    } catch (walletError) {
      // Log but don't fail if wallet creation fails
      console.warn('[createMemberFromSignUp] Wallet creation failed:', walletError);
    }

    return data as Member;
  } catch (err: any) {
    console.error('[createMemberFromSignUp] Error:', err.message || err);
    throw err;
  }
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
  phone?: string,
  userId?: string
) {
  // Validate required fields BEFORE any database operation
  const trimmedName = (fullName || '')?.trim() || '';
  const trimmedPhone = (phone || '')?.trim() || '';
  
  // CRITICAL: Name must never be empty
  if (!trimmedName || trimmedName.length === 0) {
    throw new Error('Full name is required and cannot be empty');
  }

  const { data, error } = await supabase
    .from('members')
    .insert([
      {
        chama_id: chamaId,
        name: trimmedName,
        phone: trimmedPhone || null,
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

export async function getUserMemberId(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.id || null;
  } catch (error) {
    console.error('Error getting user member_id:', error);
    return null;
  }
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
    .select('*')
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
    .select('*')
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
    .select('*')
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
    .select('*')
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

