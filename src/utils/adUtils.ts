/**
 * Utility functions for ad management
 * Simplified to avoid aggressive reloading that triggers invalid traffic concerns
 */

/**
 * Reloads ads by pushing to the adsbygoogle array
 * Should only be called on actual route changes, not on every render
 */
export function reloadAds(): void {
  try {
    if (typeof window !== "undefined" && window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  } catch (error) {
    console.warn("Failed to reload ads:", error);
  }
}
