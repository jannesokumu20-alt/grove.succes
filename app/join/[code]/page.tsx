'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { getChamaByInviteCode, addMember } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { isValidPhoneNumber } from '@/lib/utils';
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
    fullName: '',
    phone: '',
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

    if (!validateForm() || !chama) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addMember(
        chama.id,
        formData.fullName.trim(),
        formData.phone.trim()
      );

      toast.success('Successfully joined the chama! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
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
        </div>
      </div>
    </div>
  );
}
