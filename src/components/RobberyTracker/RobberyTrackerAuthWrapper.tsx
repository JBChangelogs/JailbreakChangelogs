"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface RobberyTrackerAuthWrapperProps {
  children: React.ReactNode;
  redirectOnFail?: boolean;
  requireAuth?: boolean;
}

export default function RobberyTrackerAuthWrapper({
  children,
  redirectOnFail = true,
  requireAuth,
}: RobberyTrackerAuthWrapperProps) {
  // Environment variable to toggle auth requirement
  const authRequired =
    requireAuth ??
    process.env.NEXT_PUBLIC_ROBBERY_TRACKER_AUTH_REQUIRED === "true";

  const { isAuthenticated, isLoading, setShowLoginModal } = useAuthContext();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // If auth is not required, do nothing
    if (!authRequired) return;

    // Only redirect if auth is done loading and user is not authenticated
    if (
      redirectOnFail &&
      !isLoading &&
      !isAuthenticated &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      toast.error("You need to be logged in to use the Robbery Tracker.", {
        duration: 4000,
      });
      setShowLoginModal(true);
      router.push("/");
    }
  }, [
    isAuthenticated,
    isLoading,
    setShowLoginModal,
    router,
    authRequired,
    redirectOnFail,
  ]);

  // If auth is NOT required, always render children immediately
  if (!authRequired) {
    return <>{children}</>;
  }

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="border-button-info mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-secondary-text">Checking access...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    if (redirectOnFail) {
      return null;
    }

    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="border-border-primary bg-secondary-bg w-full max-w-2xl rounded-lg border p-6 text-center shadow-sm">
          <h2 className="text-primary-text text-2xl font-semibold">
            Login required
          </h2>
          <p className="text-secondary-text mx-auto mt-3 max-w-xl text-base leading-relaxed">
            You must be logged in to access live robbery data. This helps
            prevent abuse and keeps queue times reasonable.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowLoginModal(true)}>Log In</Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
