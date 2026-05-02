'use client';

import { useState } from 'react';
import { Lock, Phone, Eye, EyeOff, Shield, Users, BarChart3, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-0 md:min-h-screen">
        {/* Left Sidebar */}
        <div className="md:col-span-1 bg-slate-900 border-r border-slate-800 p-8 flex flex-col justify-between">
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
        <div className="md:col-span-4 grid md:grid-cols-2">
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

              {/* Form */}
              <form className="space-y-5">
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
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
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Sign In
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
                  className="w-full py-2.5 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <text x="0" y="20" fontSize="20" fill="currentColor">G</text>
                  </svg>
                  Sign in with Google
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-slate-400 text-sm">
                  Don't have an account? <a href="#" className="text-green-500 hover:underline">Sign up</a>
                </p>
              </form>
            </div>
          </div>

          {/* Sign Up Column */}
          <div className="bg-slate-950 p-12 flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-slate-700 flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-slate-400 text-sm">Join Grove and start managing your Chama</p>
              </div>

              {/* Form */}
              <form className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Invite Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invite Code <span className="text-slate-500">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="Enter invite code"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors mt-6"
                >
                  Create Account
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
                  className="w-full py-2.5 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <text x="0" y="20" fontSize="20" fill="currentColor">G</text>
                  </svg>
                  Sign up with Google
                </button>

                {/* Sign In Link */}
                <p className="text-center text-slate-400 text-sm">
                  Already have an account? <a href="#" className="text-green-500 hover:underline">Sign in</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen flex flex-col bg-slate-950">
        {/* Mobile Header */}
        {!isSignUp ? (
          <div className="px-6 pt-4 pb-6 bg-slate-900 border-b border-slate-800">
            <div className="flex items-start justify-between gap-4 mb-8">
              <h1 className="text-2xl font-bold text-green-500">✓ Grove</h1>
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back!</h2>
            <p className="text-sm text-slate-400">Sign in to continue to your account</p>
          </div>
        ) : (
          <div className="px-6 pt-4 pb-6 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setIsSignUp(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
            </div>
            <p className="text-sm text-slate-400 ml-9">Join Grove and start managing your Chama</p>
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {!isSignUp ? (
            // Mobile Login
            <div className="space-y-8">
              {/* Leaf Icon */}
              <div className="flex justify-center py-8">
                <div className="w-24 h-24 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <span className="text-5xl">🌿</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Phone */}
                <div>
                  <label className="block text-base font-medium text-white mb-3">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-base font-medium text-white mb-3">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-start">
                  <a href="#" className="text-sm font-medium text-green-500 hover:text-green-400">
                    Forgot password?
                  </a>
                </div>

                {/* Sign In Button */}
                <button className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-base">
                  Sign In
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 border-t border-slate-700"></div>
                  <span className="text-slate-500 text-sm">or</span>
                  <div className="flex-1 border-t border-slate-700"></div>
                </div>

                {/* Google Sign In */}
                <button className="w-full py-4 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <text x="2" y="20" fontSize="24" fill="white">G</text>
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <button onClick={() => setIsSignUp(true)} className="text-green-500 hover:text-green-400 font-medium">
                    Sign up
                  </button>
                </p>
              </div>

              {/* Footer Info */}
              <div className="mt-12 p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex gap-3">
                <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Secure. Smart. Built for Chamas.</p>
                  <p className="text-xs text-slate-400 mt-1">Your data is encrypted and always protected.</p>
                </div>
              </div>
            </div>
          ) : (
            // Mobile Sign Up
            <div className="space-y-8">
              {/* Leaf Icon */}
              <div className="flex justify-center py-8">
                <div className="w-24 h-24 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <span className="text-5xl">🌿</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-base font-medium text-white mb-3">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-base font-medium text-white mb-3">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Invite Code */}
                <div>
                  <label className="block text-base font-medium text-white mb-3">
                    Invite Code <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter invite code"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">Get an invite code from your Chama admin</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-base font-medium text-white mb-3">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="w-full pl-12 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-green-500 mt-2">✓ Use 6+ characters with letters and numbers</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-base font-medium text-white mb-3">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Create Account Button */}
                <button className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-base mt-2">
                  Create Account
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 border-t border-slate-700"></div>
                  <span className="text-slate-500 text-sm">or</span>
                  <div className="flex-1 border-t border-slate-700"></div>
                </div>

                {/* Google Sign Up */}
                <button className="w-full py-4 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <text x="2" y="20" fontSize="24" fill="white">G</text>
                  </svg>
                  <span>Sign up with Google</span>
                </button>

                {/* Sign In Link */}
                <p className="text-center text-slate-400 text-sm">
                  Already have an account?{' '}
                  <button onClick={() => setIsSignUp(false)} className="text-green-500 hover:text-green-400 font-medium">
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
