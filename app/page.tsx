'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Safe auth check with timeout
      const timeout = setTimeout(() => {
        // Fallback to login after 2 seconds
        router.replace('/login');
      }, 2000);

      // Check localStorage for auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token) {
        clearTimeout(timeout);
        router.replace('/dashboard');
      } else {
        clearTimeout(timeout);
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Fallback to login on any error
      router.replace('/login');
    }
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
