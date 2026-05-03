'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Phone, Eye, EyeOff, Shield, Users, BarChart3, ArrowLeft } from 'lucide-react';
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
      // Validate inputs (issue #38 - clear old errors)
      if (!signInPhone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!signInPassword) {
        throw new Error('Password is required');
      }

      // Sign in with phone
      const { session, user } = await signInWithPhone(signInPhone, signInPassword);

      if (!session || !user) {
        throw new Error('Sign in failed. Please try again.');
      }

      // Verify member exists
      const member = await getMemberByUserId(user.id);
      if (!member) {
        throw new Error('User profile not found. Please sign up first.');
      }

      // Use longer delay or event-based approach (issue #19)
      // Wait for session to propagate (especially on slow networks)
      // Increased from 500ms to 1500ms to ensure auth listener fires before redirect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Sign in error:', err.message || err);
      // Show specific error to user (issue #46)
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
      // Validate inputs (issue #38 - clear old errors)
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
      // Trim both before comparing (issue #32)
      if (password.trim() !== confirmPassword.trim()) {
        throw new Error('Passwords do not match');
      }

      // Sign up
      const { session, user } = await signUpWithPhone(signUpPhone, password, fullName);

      if (!session || !user) {
        throw new Error('Sign up failed. Please try again.');
      }

      if (!user.email) {
        throw new Error('Failed to create user account. Please try again.');
      }

      // Create member record with email
      await createMemberFromSignUp(user.id, fullName, signUpPhone, user.email, inviteCode);

      // Use longer delay or event-based approach (issue #19)
      // Wait for session to propagate
      // Increased from 500ms to 1500ms to ensure auth listener fires before redirect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Sign up error:', err.message || err);
      // Show specific error to user (issue #46)
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-0 lg:min-h-screen">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 bg-slate-900 border-r border-slate-800 p-8 flex flex-col justify-between">
          {/* Logo & Tagline */}
          <div>
            <h1 className="text-3xl font-bold text-green-500 mb-8">✓ Grove</h1>
            <p className="text-slate-400 text-sm mb-12">
              Secure. Smart.<br />Built for Chamas.
            </p>

            {/* Features List */}
            <div className="space-y-8">
              {/* Manage Group */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Manage your group</p>
                  <p className="text-xs text-slate-500 mt-1">Add members, track contributions and more.</p>
                </div>
              </div>

              {/* Real-time Insights */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Real-time insights</p>
                  <p className="text-xs text-slate-500 mt-1">Get powerful reports and analytics instantly.</p>
                </div>
              </div>

              {/* Secure & Private */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Secure & private</p>
                  <p className="text-xs text-slate-500 mt-1">Your data is encrypted and always protected.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div>
            <div className="flex gap-2 mb-6 p-3 bg-slate-800/50 rounded-lg">
              <Shield className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                Need help? <a href="#" className="text-green-500 hover:underline">Contact support</a>
              </p>
            </div>
            <p className="text-xs text-slate-600">© 2025 Grove. All rights reserved.</p>
          </div>
        </div>

        {/* Main Content Area - Two Column */}
        <div className="lg:col-span-4 grid lg:grid-cols-2">
          {/* Login Column */}
          <div className="bg-slate-900/50 border-r border-slate-800 p-12 flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-slate-700 flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome back!</h2>
                <p className="text-slate-400">Sign in to continue to your account</p>
              </div>

              {/* Error Message */}
              {error && !isSignUp && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-5">
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      value={signInPhone}
                      onChange={(e) => setSignInPhone(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <a href="#" className="text-sm text-green-500 hover:underline">Forgot password?</a>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-900 text-slate-500">or</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full py-2.5 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <text x="0" y="20" fontSize="20" fill="currentColor">G</text>
                  </svg>
                  Sign in with Google
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-slate-400 text-sm">
                  Don't have an account? <button type="button" onClick={() => { setIsSignUp(true); setError(null); }} className="text-green-500 hover:underline">Sign up</button>
                </p>
              </form>
            </div>
          </div>

          {/* Sign Up Column */}
          <div className="bg-slate-950 p-12 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-slate-700 flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-slate-400 text-sm">Join Grove and start managing your Chama</p>
              </div>

              {/* Error Message */}
              {error && isSignUp && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignUp} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Invite Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invite Code <span className="text-slate-500">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-500 mt-2">Get an invite code from your Chama admin</p>
                </div>

                {/* Create Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-green-500 mt-2">✓ Use 6+ characters with letters and numbers</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-950 text-slate-500">or</span>
                  </div>
                </div>

                {/* Google Sign Up */}
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full py-2.5 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <text x="0" y="20" fontSize="20" fill="currentColor">G</text>
                  </svg>
                  Sign up with Google
                </button>

                {/* Sign In Link */}
                <p className="text-center text-slate-400 text-sm">
                  Already have an account? <button type="button" onClick={() => { setIsSignUp(false); setError(null); }} className="text-green-500 hover:underline">Sign in</button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
          {isSignUp && (
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className="p-2 hover:bg-slate-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
          )}
          {!isSignUp && <div />}
          <h1 className="text-xl font-bold text-green-500">Grove</h1>
          <div className="w-8" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isSignUp ? (
            // Sign In
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-slate-700 flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
                <p className="text-sm text-slate-400">Sign in to continue</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-5">
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      value={signInPhone}
                      onChange={(e) => setSignInPhone(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-slate-400 text-sm">
                  Don't have an account? <button type="button" onClick={() => { setIsSignUp(true); setError(null); }} className="text-green-500 hover:underline">Sign up</button>
                </p>
              </form>
            </div>
          ) : (
            // Sign Up
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-slate-700 flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-sm text-slate-400">Join Grove today</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignUp} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Invite Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invite Code <span className="text-slate-500">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-500 mt-2">Get from Chama admin</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="6+ characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>

                {/* Sign In Link */}
                <p className="text-center text-slate-400 text-sm">
                  Have an account? <button type="button" onClick={() => { setIsSignUp(false); setError(null); }} className="text-green-500 hover:underline">Sign in</button>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
