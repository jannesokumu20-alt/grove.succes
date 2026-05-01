'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { getChamaByInviteCode, signUp, addMember } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { isValidEmail, isValidPhoneNumber } from '@/lib/utils';
import type { Chama } from '@/types';

export default function JoinPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chama, setChama] = useState<Chama | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchChama = async () => {
      try {
        const foundChama = await getChamaByInviteCode(params.code);
        if (!foundChama) {
          toast.error('Invalid invite code');
          router.push('/login');
          return;
        }
        setChama(foundChama);
      } catch (error: any) {
        toast.error('Failed to load chama');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChama();
  }, [params.code, router, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !chama) {
      return;
    }

    // Extra safety check: ensure name is not empty before proceeding
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrors({ name: 'Full name is required' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create auth user
      const authData = await signUp(
        formData.email,
        formData.password,
        trimmedName
      );

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Step 2: Add user as member to the chama
      await addMember(
        chama.id,
        trimmedName,
        '', // phone optional for invite signup
        authData.user.id // link user immediately
      );

      toast.success('Account created! Redirecting to your dashboard...');
      setTimeout(() => router.push('/member'), 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join chama');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!chama) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Invalid invite code</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-grove-accent mb-2">
            🌿 Grove
          </h1>
          <p className="text-slate-400">Join a Chama</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Join {chama.name}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Monthly contribution: KES {chama.contribution_amount?.toLocaleString()}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
            />

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

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              error={errors.confirmPassword}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Join Chama & Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
