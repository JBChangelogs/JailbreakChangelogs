"use client";

import { ReactNode, useMemo } from "react";
import { useSafeAuthContext } from "@/contexts/AuthContext";
import InventoryAdSection from "@/components/Ads/InventoryAdSection";

interface PremiumAwareLayoutProps {
  children: ReactNode;
  showMobileAd?: boolean;
}

export default function PremiumAwareLayout({
  children,
  showMobileAd = true,
}: PremiumAwareLayoutProps) {
  // Safely access auth context - returns undefined if not available (e.g., during SSR)
  const authContext = useSafeAuthContext();
  const user = authContext?.user;
  const currentUserPremiumType = user?.premiumtype || 0;

  // Show ads for non-premium users (premium type 0) or invalid premium types (> 3)
  // Defaults to true (show ads) when context is undefined (SSR or before hydration)
  const isNonPremium = useMemo(() => {
    // If context is not available, default to showing ads (safe default)
    if (!authContext) return true;
    return currentUserPremiumType === 0 || currentUserPremiumType > 3;
  }, [authContext, currentUserPremiumType]);

  return (
    <>
      {/* Mobile Ad - Show above content on mobile only for non-premium users */}
      {showMobileAd && isNonPremium && (
        <div className="lg:hidden">
          <InventoryAdSection className="mb-6" />
        </div>
      )}

      {/* Main content with conditional sidebar layout */}
      <div
        className={`grid gap-8 ${isNonPremium ? "grid-cols-1 lg:grid-cols-4 lg:gap-12 xl:grid-cols-5 2xl:grid-cols-6" : "grid-cols-1"}`}
      >
        {/* Main content column - takes full width for premium, 3/4 for non-premium */}
        <div
          className={`space-y-6 ${isNonPremium ? "lg:col-span-3 xl:col-span-4 2xl:col-span-5" : ""}`}
        >
          {children}
        </div>

        {/* Desktop Sidebar Ad - Only render for non-premium users */}
        {isNonPremium && (
          <div className="hidden lg:col-span-1 lg:block lg:pl-8 xl:col-span-1 2xl:col-span-1">
            <div className="sticky top-20">
              <InventoryAdSection />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
