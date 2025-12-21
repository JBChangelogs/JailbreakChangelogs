"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";

export default function OfflineDetector() {
  // Start with false (online) to avoid false offline messages
  // Only show offline when we actually detect offline events
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Check initial state after component mounts
    // This ensures we get the actual current state rather than relying on initial navigator.onLine
    const checkInitialState = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOffline(true);
      }
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial state after a brief delay to ensure navigator is ready
    const timeoutId = setTimeout(checkInitialState, 100);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="w-full bg-[#B45309] text-white backdrop-blur-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="relative flex flex-col items-center justify-center gap-2 lg:flex-row lg:gap-3">
          <div className="flex items-center gap-2">
            <Icon
              icon="material-symbols:wifi-off-rounded"
              className="h-4 w-4"
            />
            <span className="text-center text-xs font-semibold text-white">
              You are currently offline. Check your internet connection.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
