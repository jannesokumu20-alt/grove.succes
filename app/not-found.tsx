'use client';

import Link from 'next/link';
import Button from '@/components/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-grove-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-gray-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="flex-1 bg-grove-primary hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition inline-flex items-center justify-center"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition inline-flex items-center justify-center"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
