"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface RobberyTrackerAuthWrapperProps {
  children: React.ReactNode;
}

export default function RobberyTrackerAuthWrapper({
  children,
}: RobberyTrackerAuthWrapperProps) {
  // Environment variable to toggle auth requirement
  const authRequired =
    process.env.NEXT_PUBLIC_ROBBERY_TRACKER_AUTH_REQUIRED === "true";

  const { isAuthenticated, isLoading, setShowLoginModal } = useAuthContext();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // If auth is not required, do nothing
    if (!authRequired) return;

    // Only redirect if auth is done loading and user is not authenticated
    if (!isLoading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error("You need to be logged in to use the Robbery Tracker.", {
        duration: 4000,
        position: "bottom-right",
      });
      setShowLoginModal(true);
      router.push("/");
    }
  }, [isAuthenticated, isLoading, setShowLoginModal, router, authRequired]);

  // If auth is NOT required, always render children immediately
  if (!authRequired) {
    return <>{children}</>;
  }

  // If auth IS required:

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-border-primary bg-secondary-bg p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-48 rounded bg-tertiary-bg"></div>
              <div className="h-6 w-24 rounded bg-tertiary-bg"></div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border-primary bg-secondary-bg p-4"
                >
                  <div className="mb-4 h-40 w-full rounded bg-tertiary-bg"></div>
                  <div className="space-y-2">
                    <div className="h-6 w-32 rounded bg-tertiary-bg"></div>
                    <div className="h-4 w-24 rounded bg-tertiary-bg"></div>
                    <div className="h-4 w-full rounded bg-tertiary-bg"></div>
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
