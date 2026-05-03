'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Phone, Eye, EyeOff, Shield } from 'lucide-react';
import { signInWithPhone, signUpWithPhone, createMemberFromSignUp, getSession, getMemberByUserId } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In form state
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form state
  const [fullName, setFullName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session) {
          const member = await getMemberByUserId(session.user.id);
          if (member) {
            router.replace('/dashboard');
          }
        }
      } catch (err) {
        console.log('Not authenticated, showing login');
      }
    };

    checkAuth();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!signInPhone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!signInPassword) {
        throw new Error('Password is required');
      }

      const { session, user } = await signInWithPhone(signInPhone, signInPassword);

      if (!session || !user) {
        throw new Error('Sign in failed. Please try again.');
      }

      const member = await getMemberByUserId(user.id);
      if (!member) {
        throw new Error('User profile not found. Please sign up first.');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Sign in error:', err.message || err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!fullName.trim()) {
        throw new Error('Full name is required');
      }
      if (!signUpPhone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (password.trim() !== confirmPassword.trim()) {
        throw new Error('Passwords do not match');
      }

      const { session, user } = await signUpWithPhone(signUpPhone, password, fullName);

      if (!session || !user) {
        throw new Error('Sign up failed. Please try again.');
      }

      if (!user.email) {
        throw new Error('Failed to create user account. Please try again.');
      }

      await createMemberFromSignUp(user.id, fullName, signUpPhone, user.email, inviteCode);

      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Sign up error:', err.message || err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {!isSignUp ? (
          // SIGN IN FORM
          <>
            {/* Logo Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                <span className="text-4xl">🌿</span>
              </div>
              <h1 className="text-3xl font-bold text-green-500 mb-2">Grove</h1>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back! 👋</h2>
              <p className="text-slate-400 text-sm">Sign in to continue to your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-5 mb-8">
              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={signInPhone}
                    onChange={(e) => setSignInPhone(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3 bg-[#1a2535] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-3 bg-[#1a2535] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Or Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0B1120] text-slate-500">or</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              disabled={isLoading}
              className="w-full py-3 border border-slate-700 rounded-xl text-white font-semibold hover:bg-slate-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <text x="0" y="20" fontSize="20" fill="currentColor">G</text>
              </svg>
              Sign in with Google
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className="text-green-500 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </>
        ) : (
          // SIGN UP FORM
          <>
            {/* Logo Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                <span className="text-4xl">🌿</span>
              </div>
              <h1 className="text-3xl font-bold text-green-500 mb-2">Grove</h1>
              <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-slate-400 text-sm">Join Grove and manage your Chama</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-5 mb-8">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3 bg-[#1a2535] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Invite Code */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Invite Code <span className="text-slate-500">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-[#1a2535] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-2">Get from your Chama admin</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6+ characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-3 bg-[#1a2535] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-3 bg-[#1a2535] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Or Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0B1120] text-slate-500">or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              disabled={isLoading}
              className="w-full py-3 border border-slate-700 rounded-xl text-white font-semibold hover:bg-slate-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <text x="0" y="20" fontSize="20" fill="currentColor">G</text>
              </svg>
              Sign up with Google
            </button>

            {/* Sign In Link */}
            <p className="text-center text-slate-400 text-sm">
              Have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-green-500 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </>
        )}

        {/* Security Badge - Bottom */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-400 font-medium">Secure. Smart. Built for Chamas.</p>
          </div>
          <p className="text-xs text-slate-600 text-center">Your data is encrypted and protected.</p>
        </div>
      </div>
    </div>
  );
}
