"use client";

import { useEffect, useRef } from "react";
import { clearAdContent, reloadAds } from "@/utils/adUtils";

interface AdReloaderOptions {
  enabled?: boolean;
  onRouteChangeStart?: () => void;
  onRouteChangeComplete?: () => void;
}

/**
 * Custom hook to handle ad reloading on route changes
 * This hook listens for route changes and reloads ads by:
 * 1. Clearing existing ad content before route change
 * 2. Reloading the AdSense script after route change
 */
export function useAdReloader(options: AdReloaderOptions = {}) {
  const { enabled = true, onRouteChangeStart, onRouteChangeComplete } = options;
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleRouteChangeStart = () => {
      isNavigatingRef.current = true;

      // Clear existing ad content before route change
      clearAdContent();

      onRouteChangeStart?.();
    };

    const handleRouteChangeComplete = () => {
      isNavigatingRef.current = false;

      // Reload AdSense script and push new ads
      setTimeout(() => {
        reloadAds();
      }, 100); // Small delay to ensure DOM is ready

      onRouteChangeComplete?.();
    };

    // Listen for popstate events (back/forward navigation)
    const handlePopState = () => {
      handleRouteChangeStart();
      setTimeout(handleRouteChangeComplete, 50);
    };

    // Add event listeners
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, onRouteChangeStart, onRouteChangeComplete]);

  // Function to manually trigger ad reload
  const manualReloadAds = () => {
    if (isNavigatingRef.current) return;
    reloadAds();
  };

  return { reloadAds: manualReloadAds };
}
