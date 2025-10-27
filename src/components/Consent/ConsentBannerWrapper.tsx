"use client";

import { Suspense } from "react";
import CookieConsentBanner from "./CookieConsentBanner";

/**
 * Wrapper component to ensure CookieConsentBanner is rendered on the client
 * after all providers are initialized
 */
export default function ConsentBannerWrapper() {
  return (
    <Suspense fallback={null}>
      <CookieConsentBanner />
    </Suspense>
  );
}
