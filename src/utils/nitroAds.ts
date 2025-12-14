/**
 * Utility functions for handling Nitro Ads in the application
 */

/**
 * Interface for Nitro Ad instances
 */
export interface NitroAdInstance {
  onNavigate?: (href?: string) => void;
  [key: string]: unknown;
}

/**
 * References to created Nitro Ads
 */
interface NitroAdReference {
  id: string;
  adInstance: NitroAdInstance;
}

// Store references to all created ads
const adReferences: NitroAdReference[] = [];

/**
 * Register a new ad instance
 * @param id The DOM ID of the ad
 * @param adInstance The ad instance returned from createAd
 */
export const registerAdInstance = (id: string, adInstance: NitroAdInstance) => {
  // Check if this ad already exists in our references
  const existingIndex = adReferences.findIndex((ref) => ref.id === id);

  if (existingIndex >= 0) {
    // Update the existing reference
    adReferences[existingIndex].adInstance = adInstance;
  } else {
    // Add a new reference
    adReferences.push({ id, adInstance });
  }
};

/**
 * Trigger onNavigate for all registered Nitro Ads
 * Call this function when navigating between pages in the SPA
 * @param href Optional URL to navigate to after interstitial is dismissed
 */
export const refreshAllAds = (href?: string) => {
  if (typeof window === "undefined") return;

  // Call onNavigate on all registered ad instances
  adReferences.forEach(({ adInstance }) => {
    if (adInstance && typeof adInstance.onNavigate === "function") {
      adInstance.onNavigate(href);
    }
  });
};

/**
 * Remove an ad reference
 * @param id The DOM ID of the ad to remove
 */
export const removeAdReference = (id: string) => {
  const index = adReferences.findIndex((ref) => ref.id === id);
  if (index >= 0) {
    adReferences.splice(index, 1);
  }
};
