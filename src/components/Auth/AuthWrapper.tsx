"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthWrapperProps {
  children: React.ReactNode;
  /**
   * Optional loading state to show while checking authentication
   */
  fallback?: React.ReactNode;
  /**
   * Optional path to redirect to if not authenticated.
   * If not provided, it will stay on the current page but show nothing (or trigger the login modal).
   */
  redirectTo?: string;
  /**
   * Whether to automatically show the login modal if not authenticated
   * Default: true
   */
  showLoginModal?: boolean;
}

/**
 * A generalized authentication wrapper component.
 * Use this to restrict access to specific components or sections of a page.
 */
export default function AuthWrapper({
  children,
  fallback,
  redirectTo,
  showLoginModal = true,
}: AuthWrapperProps) {
  const { isAuthenticated, isLoading, setShowLoginModal } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Only act once loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      if (showLoginModal) {
        setShowLoginModal(true);
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    setShowLoginModal,
    router,
    redirectTo,
    showLoginModal,
  ]);

  // Show loading fallback while checking auth status
  if (isLoading) {
    return (
      fallback || (
        <div className="flex h-[200px] w-full items-center justify-center">
          <div className="border-button-info h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      )
    );
  }

  // If not authenticated, don't render children
  // Navigation or modal trigger handled by useEffect
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
