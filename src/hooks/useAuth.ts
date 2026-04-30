'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let isSubscribed = true;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        // First, try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setUser(null);
        } else if (session?.user) {
          if (isSubscribed) {
            setUser(session.user as any);
          }
        } else {
          // No active session
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (isSubscribed) {
          if (session?.user) {
            setUser(session.user as any);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      isSubscribed = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [setUser, setLoading]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return { user, logout };
}
