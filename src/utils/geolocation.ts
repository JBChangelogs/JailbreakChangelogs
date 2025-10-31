import { headers } from "next/headers";
import type { ConsentConfig } from "./googleConsentMode";

/**
 * Countries that require opt-in consent (GDPR, LGPD, etc.)
 * These users will see the consent banner and must actively accept to enable personalized ads
 */
const REGULATED_COUNTRIES = new Set([
  // EU Countries (GDPR)
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden

  // Other regulated regions
  "BR", // Brazil (LGPD)
  "AU", // Australia (Privacy Act)
  "CA", // Canada (PIPEDA)
  "GB", // United Kingdom (UK GDPR)
  "CH", // Switzerland (Federal Data Protection Act)
  "NO", // Norway (GDPR-like)
  "IS", // Iceland (GDPR-like)
  "LI", // Liechtenstein (GDPR-like)
]);

// US states with comprehensive consumer privacy laws where we default to opt-in
const US_OPT_IN_STATES = new Set([
  "CA", // California (CCPA/CPRA)
  "CO", // Colorado (CPA)
  "CT", // Connecticut (CTDPA)
  "DE", // Delaware (DPDPA)
  "IN", // Indiana (ICDPA)
  "IA", // Iowa (ICDPA)
  "KY", // Kentucky (KCDPA)
  "MD", // Maryland (MODPA)
  "MN", // Minnesota (MCDPA)
  "MT", // Montana (MCDPA)
  "NH", // New Hampshire (NHPA)
  "NE", // Nebraska (NDPA)
  "NJ", // New Jersey (NJDPA)
  "OR", // Oregon (OCPA)
  "RI", // Rhode Island
  "TN", // Tennessee (TIPA)
  "TX", // Texas (TDPSA)
  "UT", // Utah (UCPA)
  "VA", // Virginia (VCDPA)
]);

export interface GeolocationData {
  country: string | null;
  isRegulated: boolean;
}

/**
 * Get user's country from Cloudflare headers
 * Returns geolocation data with country code and whether it's a regulated region
 *
 * Note: When running locally, Cloudflare headers won't be available.
 * In that case, we default to opt-out (non-regulated) to match most users' experience.
 */
export async function getGeolocation(): Promise<GeolocationData> {
  try {
    const headersList = await headers();
    const country = headersList.get("cf-ipcountry");
    const regionCodeHeader = headersList.get("cf-region-code"); // e.g., "CA", "TX"

    if (!country) {
      // Default to non-regulated (opt-out) if we can't detect country
      return {
        country: null,
        isRegulated: false,
      };
    }

    const countryCode = country.toUpperCase();
    let isRegulated = REGULATED_COUNTRIES.has(countryCode);

    // US state-level opt-in: if visitor is in the US and the state is in our list
    if (!isRegulated && countryCode === "US") {
      const stateCode = regionCodeHeader
        ? regionCodeHeader.toUpperCase()
        : null;
      if (stateCode && US_OPT_IN_STATES.has(stateCode)) {
        isRegulated = true;
      }
    }

    return {
      country: countryCode,
      isRegulated,
    };
  } catch (error) {
    console.warn("Failed to detect geolocation:", error);
    // Default to non-regulated (opt-out) if detection fails
    return {
      country: null,
      isRegulated: false,
    };
  }
}

/**
 * Get default consent settings based on user's location
 * - Regulated regions: opt-in (all denied by default)
 * - Non-regulated regions: opt-out (all granted by default)
 */
export async function getDefaultConsentByRegion(): Promise<
  Partial<ConsentConfig>
> {
  const { isRegulated } = await getGeolocation();

  if (isRegulated) {
    // Regulated regions (GDPR-like and designated US states): Opt-in model (default DENIED)
    return {
      ad_user_data: "denied",
      ad_personalization: "denied",
      ad_storage: "denied",
      analytics_storage: "denied",
    };
  }

  // Others: Opt-out model (default GRANTED)
  return {
    ad_user_data: "granted",
    ad_personalization: "granted",
    ad_storage: "granted",
    analytics_storage: "granted",
  };
}
