'use client';

import { useAuth } from '@/hooks/useAuth';

interface ProtectedOGWrapperProps {
  children: React.ReactNode;
}

export default function ProtectedOGWrapper({ children }: ProtectedOGWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2]"></div>
        </div>
      </div>
    );
  }

  // If not authenticated, show message
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-8 text-center min-h-[300px] flex items-center justify-center">
          <div>
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-[#5865F2]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-muted mb-4">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to access the OG Finder feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}
