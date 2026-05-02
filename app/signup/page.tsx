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
      toast.success('Account created successfully! Redirecting...');
      
      // Attempt to sign in the user immediately after signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.log('Auto-signin failed, redirecting to login:', signInError.message);
        // If auto-signin fails, redirect to login
        router.replace('/login');
        return;
      }

      if (signInData.session) {
        console.log('Auto-signin successful, redirecting to dashboard');
        // User signed in successfully, redirect to dashboard
        router.replace('/dashboard');
      } else {
        console.log('No session after signup signin, redirecting to login');
        router.replace('/login');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'An error occurred during signup');
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
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-400 text-sm mb-6">
            Step {step} of 2
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
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
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={errors.confirmPassword}
                />

                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  onClick={handleNextStep}
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Input
                  label="Phone Number"
                  placeholder="+254712345678 or 0712345678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  error={errors.phone}
                />

                <Input
                  label="Chama Name"
                  placeholder="e.g., Kazi United"
                  value={formData.chamaName}
                  onChange={(e) =>
                    setFormData({ ...formData, chamaName: e.target.value })
                  }
                  error={errors.chamaName}
                />

                <Input
                  label="Monthly Contribution Amount (KES)"
                  type="number"
                  placeholder="5000"
                  value={formData.contributionAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contributionAmount: e.target.value,
                    })
                  }
                  error={errors.contributionAmount}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Meeting Day
                  </label>
                  <select
                    value={formData.meetingDay}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingDay: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-grove-accent"
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
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isLoading={isLoading}
                  >
                    Sign Up
                  </Button>
                </div>
              </>
            )}
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
