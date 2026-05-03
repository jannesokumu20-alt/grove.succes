'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { supabase, createChama } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { isValidEmail, isValidPhoneNumber, generateInviteCode } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    chamaName: '',
    contributionAmount: '',
    meetingDay: 'Monday',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
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

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Invalid Kenyan phone number';
    }

    if (!formData.chamaName.trim()) {
      newErrors.chamaName = 'Chama name is required';
    }

    if (!formData.contributionAmount) {
      newErrors.contributionAmount = 'Contribution amount is required';
    } else if (isNaN(parseFloat(formData.contributionAmount))) {
      newErrors.contributionAmount = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting signup for:', formData.email);
      
      if (!supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        console.error('No user returned from signup');
        toast.error('Failed to create account');
        return;
      }

      console.log('User created, now creating chama');

      // Create chama
      const inviteCode = generateInviteCode();
      await createChama(
        authData.user.id,
        formData.chamaName,
        inviteCode,
        parseFloat(formData.contributionAmount),
        formData.meetingDay,
        0
      );

      console.log('Chama created successfully');
      toast.success('Account created successfully! Check your email to confirm.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] px-4 py-6">
      <div className="w-full max-w-sm mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/login" className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

        {/* Logo */}
        <div className="bg-slate-800 rounded-full p-4 mb-4 mx-auto w-fit">
          <span className="text-2xl">🌿</span>
        </div>
        <div className="text-center">
          <h1 className="text-green-400 text-2xl font-bold text-center">
            Grove
          </h1>
          <p className="text-white text-2xl font-bold text-center">Create Account</p>
          <p className="text-gray-400 text-sm text-center mt-1 mb-6">
            Step {step} of 2
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="relative mb-4">
                  <label className="text-white text-sm font-medium mb-1 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div className="relative mb-4">
                  <label className="text-white text-sm font-medium mb-1 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="relative mb-4">
                  <label className="text-white text-sm font-medium mb-1 block">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="relative mb-4">
                  <label className="text-white text-sm font-medium mb-1 block">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-4 transition-colors"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="relative mb-4">
                  <label className="text-white text-sm font-medium mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+254712345678 or 0712345678"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div className="relative mb-4">
                  <label className="text-white text-sm font-medium mb-1 block">Chama Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Kazi United"
                    value={formData.chamaName}
                    onChange={(e) =>
                      setFormData({ ...formData, chamaName: e.target.value })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.chamaName && <p className="text-red-400 text-xs mt-1">{errors.chamaName}</p>}
                </div>

                <div className="relative mb-4">
                  <label className="text-white text-sm font-medium mb-1 block">Monthly Contribution Amount (KES)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={formData.contributionAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contributionAmount: e.target.value,
                      })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.contributionAmount && <p className="text-red-400 text-xs mt-1">{errors.contributionAmount}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white mb-2">
                    Meeting Day
                  </label>
                  <select
                    value={formData.meetingDay}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingDay: e.target.value })
                    }
                    className="w-full bg-[#1a2535] text-white border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  >
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-[#111827] border border-[#1f2937] text-white font-semibold rounded-xl py-4 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-4 transition-colors"
                  >
                    {isLoading ? 'Creating...' : 'Sign Up'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="text-gray-400 text-sm text-center mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-green-400">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
