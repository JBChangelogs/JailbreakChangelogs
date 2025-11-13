"use server";

import { cookies } from "next/headers";
import type { ConsentConfig } from "../external/googleConsentMode";
import { getDefaultConsentByRegion } from "../external/geolocation";

const CONSENT_COOKIE_NAME = "gcm-consent";
const CONSENT_POLICY_VERSION = 2;

/**
 * Server-side function to read consent from HttpOnly cookie
 * Can only be called from server components or server actions
 *
 * If no cookie exists, returns null (banner will show with region-specific defaults)
 * If cookie exists, returns the stored consent
 */
export async function getServerConsent(): Promise<Partial<ConsentConfig> | null> {
  try {
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME)?.value;

    if (!consentCookie) {
      return null;
    }

    try {
      const parsed = JSON.parse(consentCookie) as
        | Partial<ConsentConfig>
        | { v?: number; consent: Partial<ConsentConfig> };

      // Support both v1 (raw consent) and v2+ (wrapped)
      if (parsed && typeof parsed === "object" && "consent" in parsed) {
        const v = (parsed as { v?: number }).v ?? 1;
        if (v !== CONSENT_POLICY_VERSION) return null;
        return (parsed as { consent: Partial<ConsentConfig> }).consent;
      }

      // v1 cookie has no version: treat as outdated
      return null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Get default consent settings based on user's geolocation
 * Used to set initial consent defaults in the Google Consent Mode script
 */
export async function getDefaultConsent(): Promise<Partial<ConsentConfig>> {
  return getDefaultConsentByRegion();
}
