"use client";

import Link from "next/link";
import { useConsent } from "@/contexts/ConsentContext";

export default function CookieConsentBanner() {
  const { showBanner, acceptConsent, rejectConsent } = useConsent();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-secondary-bg border-t border-border-primary shadow-lg">
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

          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:gap-3 mt-4 sm:mt-0">
            <button
              onClick={rejectConsent}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-button-info hover:bg-button-info-hover rounded-lg transition-colors order-2 sm:order-1"
              aria-label="Reject all cookies"
            >
              Reject All
            </button>
            <button
              onClick={() => {
                const event = new CustomEvent("openCookieSettings");
                window.dispatchEvent(event);
              }}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-primary-text bg-tertiary-bg hover:bg-quaternary-bg border border-border-primary rounded-lg transition-colors order-1 sm:order-2"
              aria-label="Customise cookies"
            >
              Customise
            </button>
            <button
              onClick={acceptConsent}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-button-info hover:bg-button-info-hover rounded-lg transition-colors order-3"
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
