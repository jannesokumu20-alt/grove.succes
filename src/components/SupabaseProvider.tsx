'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth listener on mount
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        // Auth state changed - handled by useAuth hook
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
