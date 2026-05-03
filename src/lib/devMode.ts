/**
 * Development Mode Configuration
 * 
 * This file enables temporary bypassing of authentication for UI development.
 * Set DEV_MODE to false to restore normal authentication behavior.
 * 
 * IMPORTANT: This is for TEMPORARY development only.
 * Do NOT use in production or staging environments.
 */

// Toggle this flag to enable/disable dev mode
export const DEV_MODE = true;

// Mock user for development (when DEV_MODE is enabled)
export const MOCK_DEV_USER = {
  id: 'dev-user-uuid-12345678901234567890',
  email: 'dev@grove.local',
  user_metadata: {
    full_name: 'Developer User',
    phone: '0712345678',
  },
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Fixed mock member for development
export const MOCK_DEV_MEMBER = {
  id: 'dev-member-uuid-1234567890123456',
  chama_id: 'dev-chama-uuid-12345678901234567',
  user_id: MOCK_DEV_USER.id,
  name: 'Developer User',
  phone: '0712345678',
  email: 'dev@grove.local',
  status: 'active' as const,
  credit_score: 100,
  role: 'owner' as const,
  joined_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Check if development mode is enabled
 */
export function isDevMode(): boolean {
  return DEV_MODE === true;
}

/**
 * Get the mock user for development
 */
export function getMockDevUser() {
  return MOCK_DEV_USER;
}

/**
 * Get the mock member for development
 */
export function getMockDevMember() {
  return MOCK_DEV_MEMBER;
}
