'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import { getUserRole, canAccessPage, getRedirectForRole, UserRole } from '@/lib/rbac';
import { isDevMode } from '@/lib/devMode';

export function useRBAC() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsAuthorized(null);
      return;
    }

    const checkRole = async () => {
      // In dev mode, grant owner access to all pages
      let userRole: UserRole = 'owner';
      
      if (!isDevMode()) {
        // Normal auth flow - check role from database
        userRole = await getUserRole(user.id);
      }
      
      setRole(userRole);

      // Check if user can access current page
      const authorized = canAccessPage(userRole, pathname);
      setIsAuthorized(authorized);

      if (!authorized) {
        // Redirect to appropriate page based on role
        const redirectTo = getRedirectForRole(userRole);
        router.replace(redirectTo);
      }
    };

    checkRole();
  }, [user, pathname, router]);

  return { role, isAuthorized, isLoading: isAuthorized === null };
}
