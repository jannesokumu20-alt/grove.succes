'use client';

import { Suspense } from 'react';
import JoinPageContent from './page-content';

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-grove-dark flex items-center justify-center">
        <p className="text-slate-400">Loading invite...</p>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}

