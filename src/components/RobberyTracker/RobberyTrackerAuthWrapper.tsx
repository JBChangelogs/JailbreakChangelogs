"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

interface RobberyTrackerAuthWrapperProps {
  children: React.ReactNode;
}

export default function RobberyTrackerAuthWrapper({
  children,
}: RobberyTrackerAuthWrapperProps) {
  const { isAuthenticated, isLoading, setShowLoginModal, user } =
    useAuthContext();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
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
  }, [isAuthenticated, isLoading, setShowLoginModal, router]);

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

  // Check if user has Supporter Tier 2 or 3 (premiumtype >= 2 && <= 3)
  const hasAccess =
    user?.premiumtype && user.premiumtype >= 2 && user.premiumtype <= 3;

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-border-primary bg-secondary-bg p-8 text-center shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-button-info/10 p-4">
                <svg
                  className="h-12 w-12 text-button-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-primary-text mb-3 text-2xl font-bold">
              Early Beta Access
            </h1>
            <p className="text-secondary-text mb-6 text-lg">
              The Robbery Tracker is currently in early beta testing and is
              exclusively available to Supporter Tier 2 and Tier 3 members.
            </p>
            <div className="bg-tertiary-bg rounded-lg p-4 mb-6">
              <p className="text-secondary-text text-sm">
                This feature is being tested with our premium supporters before
                a wider release. Join Supporter Tier 2 or 3 to get early access
                to this and other exclusive features!
              </p>
            </div>
            <Link
              href="/supporting"
              className="bg-button-info hover:bg-button-info-hover text-form-button-text inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              Upgrade to Supporter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
