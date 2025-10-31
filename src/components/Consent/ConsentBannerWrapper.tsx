"use client";

import dynamic from "next/dynamic";

const ClientCookieConsentBanner = dynamic(
  () => import("./CookieConsentBanner"),
  { ssr: false },
);

export default function ConsentBannerWrapper() {
  return <ClientCookieConsentBanner />;
}
