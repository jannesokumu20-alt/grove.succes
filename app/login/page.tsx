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

      // Wait a short moment for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if user is a chama owner
      const { data: chamaData, error: chamaError } = await supabase
        .from('chamas')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (chamaData) {
        toast_service.success('Logged in successfully!');
        toast.dismiss(loadingToastId);
        router.replace('/dashboard');
        return;
      }

      // Check if user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (memberData) {
        toast_service.success('Logged in successfully!');
        toast.dismiss(loadingToastId);
        router.replace('/member');
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

      // No chama or member found - redirect to dashboard
      toast_service.success('Logged in successfully!');
      toast.dismiss(loadingToastId);
      router.replace('/dashboard');
    } catch (error: any) {
      toast_service.error(error.message || 'An error occurred during login');
      toast.dismiss(loadingToastId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grove-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-grove-accent mb-2">
            🌿 Grove
          </h1>
          <p className="text-slate-400">Tech-Powered Savings Management</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-grove-accent hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
