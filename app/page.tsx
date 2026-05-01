'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get the current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          router.replace('/login');
          return;
        }

        // If session exists, redirect to dashboard
        if (session?.user) {
          router.replace('/dashboard');
        } else {
          // No session, go to login
          router.replace('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // Fallback to login on any error
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-grove-dark to-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8 text-6xl animate-bounce">🌿</div>
        <h1 className="text-4xl font-bold text-white mb-4">Grove</h1>
        <p className="text-slate-300 text-lg mb-8">Loading your chama...</p>
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 bg-grove-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-grove-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-grove-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
