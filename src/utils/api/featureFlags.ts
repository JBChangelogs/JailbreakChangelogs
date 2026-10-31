/**
 * Feature flags utility for controlling feature availability
 * across different environments (testing vs production)
 */

export const FEATURE_FLAGS = {
  AI_SUMMARY: process.env.NEXT_PUBLIC_ENABLE_AI_SUMMARY === "true",
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}
