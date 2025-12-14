"use client";

import { useNitroAdsNavigation } from "@/hooks/useNitroAdsNavigation";

/**
 * Component that handles Nitro Ads navigation events
 * This component doesn't render anything, it just uses the hook
 * to handle navigation events for Nitro Ads
 */
export default function NitroAdsNavigationHandler() {
  // Use the hook to handle navigation events
  useNitroAdsNavigation();

  // This component doesn't render anything
  return null;
}
