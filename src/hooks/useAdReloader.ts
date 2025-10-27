"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook to handle ad reloading on route changes
 * Based on best practices: only reload ads when route actually changes
 * Avoids aggressive reloading that triggers invalid traffic concerns
 *
 * Uses debouncing (1000ms) to prevent rapid successive reloads from
 * quick navigation (e.g., dropdown selections, quick nav links)
 */
export function useAdReloader() {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Debounced ad reload function
    const debouncedReload = () => {
      // Clear any pending reload
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Schedule reload after 1000ms of inactivity
      debounceTimerRef.current = setTimeout(() => {
        if (typeof window !== "undefined" && window.adsbygoogle) {
          try {
            window.adsbygoogle.push({});
          } catch (err) {
            // Expected error when ads are already loaded on the page
            // This is safe to ignore and doesn't indicate a problem
            if (
              err instanceof Error &&
              err.message?.includes("already have ads")
            ) {
              console.debug("Ads already loaded on this page, skipping reload");
            } else {
              console.error("Error reloading ads:", err);
            }
          }
        }
      }, 1000);
    };

    // Listen for route changes via popstate (back/forward navigation)
    const handlePopstate = () => {
      debouncedReload();
    };

    // Listen for URL changes via popstate
    window.addEventListener("popstate", handlePopstate);

    // Also listen for custom route change events (for client-side navigation)
    // This handles window.history.pushState() calls
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      debouncedReload();
    };

    return () => {
      window.removeEventListener("popstate", handlePopstate);
      // Restore original pushState
      window.history.pushState = originalPushState;
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
}
