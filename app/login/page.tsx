'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { getMemberByEmailAndPhone, updateMember } from '@/lib/supabase';
import { isValidEmail } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const toast_service = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const loadingToastId = toast_service.loading('Logging in...');

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast_service.error(error.message);
        toast.dismiss(loadingToastId);
        setIsLoading(false);
        return;
      }

      // Verify session exists before redirecting
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast_service.error('Session verification failed. Please try again.');
        toast.dismiss(loadingToastId);
        setIsLoading(false);
        return;
      }

      console.log('Session verified for user:', session.user.id);

      // Check if user is a chama owner
      const { data: chamaData, error: chamaError } = await supabase
        .from('chamas')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      console.log('Chama data:', chamaData, 'Error:', chamaError);

      if (chamaData) {
        toast_service.success('Logged in successfully!');
        toast.dismiss(loadingToastId);
        console.log('Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
        return;
      }

      // Check if user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      console.log('Member data:', memberData, 'Error:', memberError);

      if (memberData) {
        toast_service.success('Logged in successfully!');
        toast.dismiss(loadingToastId);
        console.log('Redirecting to member...');
        setTimeout(() => {
          window.location.href = '/member';
        }, 100);
        return;
      }

      // If no member found with user_id, check if this user should link to an existing member
      // (someone who joined via invite code before creating an account)
      try {
        // Get the phone number from the user's metadata if available
        const phoneMetadata = session.user.user_metadata?.phone;
        
        if (phoneMetadata) {
          // Normalize both phone formats for comparison
          const normalizePhone = (phone: string) => {
            return phone.replace(/\D/g, '').replace(/^0/, '').replace(/^254/, '');
          };
          
          const normalizedAuthPhone = normalizePhone(phoneMetadata);
          
          // Get all unlinked members
          const { data: unlinkedMembers, error: unlinkedError } = await supabase
            .from('members')
            .select('*')
            .is('user_id', null);

          if (unlinkedMembers && unlinkedMembers.length > 0) {
            // Find a member with matching normalized phone
            const matchingMember = unlinkedMembers.find((member: any) => {
              const normalizedMemberPhone = normalizePhone(member.phone || '');
              return normalizedMemberPhone === normalizedAuthPhone;
            });

            if (matchingMember) {
              // Link this member to the user
              await updateMember(matchingMember.id, { user_id: session.user.id });
              toast_service.success('Logged in successfully!');
              toast.dismiss(loadingToastId);
              router.replace('/member');
              return;
            }
          }
        }
      } catch (err) {
        // If linking fails, continue with standard redirect
        console.error('Member linking error:', err);
      }

      // No chama or member found
      toast_service.success('Logged in successfully!');
      toast.dismiss(loadingToastId);
      console.log('No chama or member found, redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    } catch (error: any) {
      toast_service.error(error.message || 'An error occurred during login');
      toast.dismiss(loadingToastId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="bg-slate-800 rounded-full p-4 mb-4 mx-auto w-fit">
          <span className="text-2xl">🌿</span>
        </div>
        <div className="text-center">
          <h1 className="text-green-400 text-2xl font-bold text-center">
            Grove
          </h1>
          <p className="text-white text-2xl font-bold text-center mt-2">Welcome Back</p>
          <p className="text-gray-400 text-sm text-center mt-1 mb-6">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative mb-4">
              <label className="text-white text-sm font-medium mb-1 block">Email Address</label>
              <div className="absolute left-3 top-3.5 text-gray-400 w-4 h-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 pl-10 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="relative mb-4">
              <label className="text-white text-sm font-medium mb-1 block">Password</label>
              <div className="absolute left-3 top-3.5 text-gray-400 w-4 h-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 pl-10 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-4 mt-2 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-gray-400 text-sm text-center mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-green-400">
              Sign up
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure login protected by encryption
          </div>
        </div>
      </div>
    </div>
  );
}
