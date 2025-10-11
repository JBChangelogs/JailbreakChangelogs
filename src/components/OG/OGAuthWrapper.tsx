"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface OGAuthWrapperProps {
  children: React.ReactNode;
}

export default function OGAuthWrapper({ children }: OGAuthWrapperProps) {
  const { isAuthenticated, isLoading, setShowLoginModal } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth is done loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      setShowLoginModal(true);
      router.push("/og");
    }
  }, [isAuthenticated, isLoading, setShowLoginModal, router]);

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-600"></div>
              <div className="flex-1">
                <div className="mb-2 h-6 w-32 rounded bg-gray-600"></div>
                <div className="h-4 w-24 rounded bg-gray-600"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg p-4">
                  <div className="h-12 w-12 rounded bg-gray-600"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-gray-600"></div>
                    <div className="h-3 w-32 rounded bg-gray-600"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
