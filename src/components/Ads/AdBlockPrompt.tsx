"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

import { Icon } from "@/components/ui/IconWrapper";

// Simple ad block detection strategy:
// 1. Show modal immediately if adblock is detected
// 2. Modal dismissal saved to sessionStorage (resets on new browser session)

const MODAL_DISMISSED_KEY = "adblock_modal_dismissed";

const AdBlockPrompt = () => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return sessionStorage.getItem(MODAL_DISMISSED_KEY) === "true";
      }
    } catch {
      return false;
    }
    return false;
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Listen for ad-block detection event
    const handleAdBlockDetection = (e: CustomEvent) => {
      if (e.detail?.blocking) {
        setIsBlocking(true);
      }
    };

    document.addEventListener(
      "np.detect",
      handleAdBlockDetection as EventListener,
    );

    // Check after delay
    const checkTimeout = setTimeout(() => {
      if (window.npDetect && window.npDetect.blocking) {
        setIsBlocking(true);
      }
    }, 2500);

    return () => {
      clearTimeout(checkTimeout);
      document.removeEventListener(
        "np.detect",
        handleAdBlockDetection as EventListener,
      );
    };
  }, [pathname]);

  const handleModalDismiss = () => {
    // Save modal dismissal to sessionStorage (resets on browser close)
    try {
      sessionStorage.setItem(MODAL_DISMISSED_KEY, "true");
    } catch {
      // Silent fail
    }

    setIsDismissed(true);
    setIsBlocking(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleModalDismiss();
    }
  };

  const handleSupporterClick = () => {
    router.push("/supporting");
  };

  if (
    !isBlocking ||
    isDismissed ||
    pathname === "/supporting" ||
    pathname === "/redeem"
  ) {
    return null;
  }

  // Show modal immediately
  return (
    <div
      onClick={handleBackdropClick}
      className="bg-overlay-bg fixed inset-0 z-2147483647 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="bg-secondary-bg border-button-info relative mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border shadow-xl">
        {/* Close button */}
        <button
          onClick={handleModalDismiss}
          className="text-secondary-text hover:text-primary-text absolute top-4 right-4 z-10 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <Icon icon="material-symbols:close" className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center px-6 py-10 text-center md:px-10">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent.webp"
              alt="JBCL Logo"
              width={600}
              height={100}
              className="mx-auto h-auto w-[240px]"
            />
          </div>

          {/* Title */}
          <h2 className="text-primary-text mb-4 text-2xl font-bold">
            We noticed you&apos;re using an ad blocker.
          </h2>

          {/* Message */}
          <p className="text-secondary-text mb-8 text-base leading-relaxed">
            Ads help us keep our content free and accessible to everyone. By
            allowing ads, you&apos;re directly supporting the developers and the
            website.
            <br />
            <br />
            Please consider whitelisting our site — it only takes a moment, and
            it makes a big difference.
          </p>

          {/* Alternative Option */}
          <div className="mb-0 w-full sm:mb-8">
            <button
              onClick={handleSupporterClick}
              className="bg-button-info text-form-button-text hover:bg-button-info-hover w-full max-w-xs cursor-pointer rounded-lg px-6 py-3 text-base font-bold tracking-wide uppercase shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
            >
              Become A Supporter
            </button>
          </div>

          {/* Dismiss Link */}
          <button
            onClick={handleModalDismiss}
            className="text-secondary-text hover:text-primary-text cursor-pointer text-sm font-medium transition-colors hover:underline"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdBlockPrompt;
