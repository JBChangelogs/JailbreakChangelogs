"use server";

import { cookies } from "next/headers";
import type { ConsentConfig } from "./googleConsentMode";

const CONSENT_COOKIE_NAME = "gcm-consent";

/**
 * Server-side function to read consent from HttpOnly cookie
 * Can only be called from server components or server actions
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
