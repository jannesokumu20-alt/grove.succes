'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-grove-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <p className="text-6xl mb-4">⚠️</p>
          <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error.message}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={reset}
            variant="primary"
            className="flex-1"
          >
            Try again
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="secondary" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
