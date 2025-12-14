"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Hook to handle Nitro Ads navigation in Next.js app
 *
 * This hook will call nitroAds.onNavigate() whenever the route changes
 * in the Next.js application, ensuring ads are properly refreshed during SPA navigation.
 */
export function useNitroAdsNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // Check if nitroAds is available
    if (!window.nitroAds) return;

    // Call onNavigate to refresh ads when route changes
    if (typeof window.nitroAds.onNavigate === "function") {
      window.nitroAds.onNavigate();
    }
  }, [pathname, searchParams]);
}
