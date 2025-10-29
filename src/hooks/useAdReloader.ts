"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook to handle ad reloading on route changes
 *
 * Handles TWO types of navigation:
 * 1. Full page navigation (Next.js router.push) - detected via popstate
 * 2. Client-side navigation (window.history.pushState) - detected via custom event
 *
 * Best practices implemented:
 * - Debounces reloads to prevent aggressive behavior that triggers invalid traffic warnings
 * - Avoids reloading ads multiple times on the same page
 * - Handles errors gracefully without breaking the app
 *
 * Google AdSense guidelines:
 * - Never reload ads more than once per page view
 * - Don't reload ads on every state change or re-render
 * - Only reload when user navigates to a new page
 */
export function useAdReloader() {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const adReloadedRef = useRef(false);

  useEffect(() => {
    // Debounced ad reload function
    const debouncedReload = () => {
      // Clear any pending reload
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Reset reload flag for new navigation
      adReloadedRef.current = false;

      // Debounce ad reload to avoid rapid successive reloads
      // This prevents Google from flagging as invalid traffic
      debounceTimerRef.current = setTimeout(() => {
        if (
          typeof window !== "undefined" &&
          window.adsbygoogle &&
          !adReloadedRef.current
        ) {
          try {
            window.adsbygoogle.push({});
            adReloadedRef.current = true;
          } catch (err) {
            // Common errors that are safe to ignore:
            // - "All ins elements in the DOM with class adsbygoogle already have ads"
            // - "Only one 'enable_page_level_ads' allowed per page"
            if (err instanceof Error) {
              if (
                err.message?.includes("already have ads") ||
                err.message?.includes("enable_page_level_ads")
              ) {
                // These are expected and safe - ads are already loaded
                console.debug("Ads already initialized on this page");
              } else {
                console.warn("Ad reload warning:", err.message);
              }
            }
          }
        }
      }, 1200); // Slightly longer debounce to ensure DOM is ready
    };

    // Listen for full page navigation (back/forward buttons)
    const handlePopstate = () => {
      debouncedReload();
    };

    // Listen for client-side navigation via window.history.pushState
    // This is used by pages like /changelogs and /seasons for switching items
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      debouncedReload();
    };

    window.addEventListener("popstate", handlePopstate);

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
