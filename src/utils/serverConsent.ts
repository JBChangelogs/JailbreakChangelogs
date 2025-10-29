"use server";

import { cookies } from "next/headers";
import type { ConsentConfig } from "./googleConsentMode";
import { getDefaultConsentByRegion } from "./geolocation";

const CONSENT_COOKIE_NAME = "gcm-consent";

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
      return JSON.parse(consentCookie) as Partial<ConsentConfig>;
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
