'use client';

import React from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />
        
        <div className="mt-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Something went wrong!
              </h1>
              <p className="text-gray-300 mb-6">
                We encountered an error while loading the season data. This might be a temporary issue.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full bg-[#FFB636] hover:bg-[#FFA500] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Try again
              </button>
              
              <button
                onClick={() => window.location.href = '/seasons'}
                className="w-full bg-[#37424D] hover:bg-[#2E3944] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Go to Seasons
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-gray-400 cursor-pointer text-sm">
                  Error details (development only)
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-[#1a1a1a] p-3 rounded overflow-auto">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 