"use client";

import Link from "next/link";
import { useConsent } from "@/contexts/ConsentContext";

export default function CookieConsentBanner() {
  const { showBanner, acceptConsent, rejectConsent } = useConsent();

  if (!showBanner) return null;

  return (
    <div className="border-border-primary bg-secondary-bg fixed right-0 bottom-0 left-0 z-40 border-t shadow-lg">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-primary-text text-sm font-semibold">
              We value your privacy
            </p>
            <p className="text-secondary-text mt-2 text-xs">
              We use cookies to enhance your browsing experience, serve
              personalised ads or content, and analyse our traffic. By clicking
              &quot;Accept All&quot;, you consent to our use of cookies.{" "}
              <Link
                href="/privacy"
                className="text-button-info hover:text-button-info-hover underline transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:flex-row sm:gap-3">
            <button
              onClick={rejectConsent}
              className="bg-button-info hover:bg-button-info-hover order-2 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors sm:order-1"
              aria-label="Reject all cookies"
            >
              Reject All
            </button>
            <button
              onClick={() => {
                const event = new CustomEvent("openCookieSettings");
                window.dispatchEvent(event);
              }}
              className="border-border-primary bg-tertiary-bg text-primary-text hover:bg-quaternary-bg order-1 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:order-2"
              aria-label="Customise cookies"
            >
              Customise
            </button>
            <button
              onClick={acceptConsent}
              className="bg-button-info hover:bg-button-info-hover order-3 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              aria-label="Accept all cookies"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
