'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          setUser(null);
          return;
        }
        setUser(data.user as any);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        setUser(session?.user as any);
      }
    );

    return () => {
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
