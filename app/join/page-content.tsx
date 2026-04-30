'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { getInviteByCode, useInviteCode } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { isValidPhoneNumber } from '@/lib/utils';
import type { Chama } from '@/types';

export default function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const code = searchParams.get('code');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chama, setChama] = useState<Chama | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchInvite = async () => {
      if (!code) {
        setError('No invite code provided');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching invite code:', code);
        const invite = await getInviteByCode(code);
        
        if (!invite) {
          setError('Invalid, expired, or already used invite code');
          setIsLoading(false);
          return;
        }

        setInviteData(invite);
        setChama(invite);
      } catch (err: any) {
        setError(err.message || 'Failed to load invite');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [code]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Invalid Kenyan phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !chama || !inviteData) return;

    setIsSubmitting(true);

    try {
      console.log('Joining chama with invite code:', code);
      
      // Use invite code to add member
      await useInviteCode(
        chama.id,
        formData.fullName,
        formData.phone
      );

      toast.success('Successfully joined! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      console.error('Join error:', err);
      toast.error(err.message || 'Failed to join chama');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading invite...</p>
      </div>
    );
  }

  if (error || !chama) {
    return (
      <div className="min-h-screen bg-grove-dark flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-grove-accent mb-2">🌿 Grove</h1>
            <p className="text-slate-400">Join a Chama</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
            <p className="text-red-400 mb-6">{error || 'Invalid invite'}</p>
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-grove-accent mb-2">🌿 Grove</h1>
          <p className="text-slate-400">Join a Chama</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Join {chama.name}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Monthly contribution: KES {(chama.contribution_amount || 0)?.toLocaleString() || '0'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              error={errors.fullName}
            />

            <Input
              label="Phone Number"
              placeholder="+254712345678 or 0712345678"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              error={errors.phone}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Join Chama
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-grove-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
