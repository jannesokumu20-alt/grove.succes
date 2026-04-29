'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/hooks/useAuth';

export default function Page() {
  const router = useRouter();
  const { user } = useAuthStore();

  useAuth();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login');
    } else {
      // Redirect to dashboard if authenticated
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-grove-dark">
      <div className="animate-pulse">
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}
