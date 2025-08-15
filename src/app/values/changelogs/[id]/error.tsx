'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Changelog details error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#2E3944] mb-8">
      <div className="container mx-auto px-4">
        <Breadcrumb />
        <div className="text-center text-white py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
            <p className="text-[#D3D9D4] mb-6">
              {error.message === 'Changelog not found' 
                ? 'The changelog you\'re looking for doesn\'t exist or has been removed.'
                : 'An unexpected error occurred while loading the changelog details.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-lg transition-colors"
              >
                Try again
              </button>
              <Link
                href="/values/changelogs"
                className="px-6 py-3 bg-[#37424D] hover:bg-[#2A3441] text-white font-medium rounded-lg transition-colors text-center"
              >
                View all changelogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 