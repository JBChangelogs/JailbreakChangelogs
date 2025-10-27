/**
 * Google Consent Mode v2 utility for managing user consent signals
 * Integrates with Clarity and other Google services
 *
 * IMPORTANT: The initial dataLayer setup with default denied state MUST be in the <head> tag
 * before any consent banner code loads. This utility handles client-side consent updates only.
 */

export type ConsentStatus = "granted" | "denied";

export interface ConsentConfig {
  analytics_storage: ConsentStatus;
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
}

/**
 * Update consent status in Google Consent Mode
 * Clarity automatically reads and honors GCM consent signals from the dataLayer
 */
export function updateGCMConsent(config: Partial<ConsentConfig>): void {
  if (typeof window === "undefined") return;

  // Update consent via gtag - Clarity automatically reads this from dataLayer
  if (window.gtag) {
    window.gtag("consent", "update", config);
  }
}

/**
 * Grant all consent (user accepted all cookies)
 */
export function grantAllConsent(): void {
  updateGCMConsent({
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
}

/**
 * Deny all consent (user rejected all cookies)
 */
export function denyAllConsent(): void {
  updateGCMConsent({
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/**
 * Get current consent status from server-side cookie via API
 */
export async function getStoredConsent(): Promise<Partial<ConsentConfig> | null> {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("/api/consent", {
      method: "GET",
      credentials: "include", // Include cookies in request
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      consent: Partial<ConsentConfig> | null;
    };
    return data.consent;
  } catch {
    return null;
  }
}

/**
 * Store consent preference in server-side cookie via API
 */
export async function storeConsent(
  config: Partial<ConsentConfig>,
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/consent", {
      method: "POST",
      credentials: "include", // Include cookies in request
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consent: config }),
    });
  } catch {
    // Silently fail - consent will still work via GCM signals
  }
}

/**
 * Declare gtag function for TypeScript
 */
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];
  }
}
