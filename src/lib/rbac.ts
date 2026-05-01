import { supabase } from './supabase';

export type UserRole = 'owner' | 'member' | 'unknown';

/**
 * Determine the user's role (owner or member)
 * Owner: has a chama where user_id matches
 * Member: is in the members table with a user_id
 * Unknown: neither owner nor member
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // Check if user is a chama owner
    const { data: chamaData } = await supabase
      .from('chamas')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (chamaData) {
      return 'owner';
    }

    // Check if user is a member
    const { data: memberData } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (memberData) {
      return 'member';
    }

    return 'unknown';
  } catch (error) {
    console.error('Error determining user role:', error);
    return 'unknown';
  }
}

/**
 * Get the chama_id for the current user
 * For owners: their chama
 * For members: their member's chama_id
 */
export async function getUserChamaId(userId: string): Promise<string | null> {
  try {
    const role = await getUserRole(userId);

    if (role === 'owner') {
      const { data } = await supabase
        .from('chamas')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      return data?.id || null;
    }

    if (role === 'member') {
      const { data } = await supabase
        .from('members')
        .select('chama_id')
        .eq('user_id', userId)
        .maybeSingle();
      return data?.chama_id || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting user chama_id:', error);
    return null;
  }
}

/**
 * Get the member_id for the current user (if they are a member)
 */
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

/**
 * Page access rules:
 * Owner: can access all pages
 * Member: can only access:
 *   - /dashboard
 *   - /contributions (their own)
 *   - /loans (their own)
 *   - /announcements
 *   - /reminders
 *   - /settings (personal)
 * 
 * Members CANNOT access:
 *   - /members (member management)
 *   - /meetings (admin only)
 *   - /fines (admin only)
 *   - /reports (admin only)
 */

const MEMBER_ALLOWED_PAGES = [
  '/dashboard',
  '/contributions',
  '/loans',
  '/announcements',
  '/reminders',
  '/settings',
];

const OWNER_ALLOWED_PAGES = [
  '/dashboard',
  '/members',
  '/contributions',
  '/loans',
  '/fines',
  '/meetings',
  '/announcements',
  '/reminders',
  '/reports',
  '/settings',
];

export function canAccessPage(role: UserRole, path: string): boolean {
  if (role === 'owner') {
    return OWNER_ALLOWED_PAGES.some((page) => path.startsWith(page));
  }

  if (role === 'member') {
    return MEMBER_ALLOWED_PAGES.some((page) => path.startsWith(page));
  }

  return false;
}

export function getRedirectForRole(role: UserRole): string {
  if (role === 'owner') {
    return '/dashboard';
  }
  if (role === 'member') {
    return '/dashboard';
  }
  return '/login';
}
