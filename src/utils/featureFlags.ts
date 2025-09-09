/**
 * Feature flags utility for controlling feature availability
 * across different environments (testing vs production)
 */

export const FEATURE_FLAGS = {
  OG_FINDER: process.env.NEXT_PUBLIC_ENABLE_OG_FINDER === "true",
  INVENTORY_CALCULATOR:
    process.env.NEXT_PUBLIC_ENABLE_INVENTORY_CALCULATOR === "true",
  DUPE_FINDER: process.env.NEXT_PUBLIC_ENABLE_DUPE_FINDER === "true",
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}

export function getFeatureFlags() {
  return FEATURE_FLAGS;
}
