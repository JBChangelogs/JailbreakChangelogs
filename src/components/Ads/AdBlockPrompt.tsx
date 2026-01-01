"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import AdBlockBanner from "./AdBlockBanner";
import { useTheme } from "@/contexts/ThemeContext";

// Progressive ad block detection strategy:
// 1. Show banner on every page (dismissible)
// 2. After 3 banner dismissals in this session: Upgrade to modal
// 3. Modal dismissal saved to sessionStorage (resets on new browser session)

const SESSION_DISMISSAL_COUNT_KEY = "adblock_session_dismissals";
const LIFETIME_DISMISSAL_COUNT_KEY = "adblock_lifetime_dismissals";
const MODAL_DISMISSED_KEY = "adblock_modal_dismissed";
const DISMISSALS_BEFORE_MODAL = 3;

const AdBlockPrompt = () => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // Check if modal was dismissed this session
  const isModalDismissed = () => {
    try {
      return sessionStorage.getItem(MODAL_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  };

  // Get session dismissal count (resets on browser close)
  const getSessionDismissalCount = () => {
    try {
      return parseInt(
        sessionStorage.getItem(SESSION_DISMISSAL_COUNT_KEY) || "0",
        10,
      );
    } catch {
      return 0;
    }
  };

  // Get lifetime dismissal count (persists forever)
  const getLifetimeDismissalCount = () => {
    try {
      return parseInt(
        localStorage.getItem(LIFETIME_DISMISSAL_COUNT_KEY) || "0",
        10,
      );
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    // Check if modal was already dismissed this session
    if (isModalDismissed()) {
      return;
    }

    // Listen for ad-block detection event
    const handleAdBlockDetection = (e: CustomEvent) => {
      if (e.detail?.blocking) {
        setIsBlocking(true);

        // Check session dismissal count to determine what to show
        const sessionDismissals = getSessionDismissalCount();

        if (sessionDismissals >= DISMISSALS_BEFORE_MODAL) {
          setShowModal(true);
        } else {
          setShowModal(false);
        }
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

        const sessionDismissals = getSessionDismissalCount();

        if (sessionDismissals >= DISMISSALS_BEFORE_MODAL) {
          setShowModal(true);
        } else {
          setShowModal(false);
        }
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

  const handleBannerDismiss = () => {
    try {
      // Increment session dismissal count (resets on browser close)
      const currentSessionCount = getSessionDismissalCount();
      const newSessionCount = currentSessionCount + 1;
      sessionStorage.setItem(
        SESSION_DISMISSAL_COUNT_KEY,
        newSessionCount.toString(),
      );

      // Also increment lifetime dismissal count (persists forever)
      const currentLifetimeCount = getLifetimeDismissalCount();
      const newLifetimeCount = currentLifetimeCount + 1;
      localStorage.setItem(
        LIFETIME_DISMISSAL_COUNT_KEY,
        newLifetimeCount.toString(),
      );
    } catch {
      // Silent fail
    }

    setIsBlocking(false);
  };

  const handleModalDismiss = () => {
    // Save modal dismissal to sessionStorage (resets on browser close)
    try {
      sessionStorage.setItem(MODAL_DISMISSED_KEY, "true");
    } catch {
      // Silent fail
    }

    setIsBlocking(false);
    setShowModal(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleModalDismiss();
    }
  };

  const handleSupporterClick = () => {
    router.push("/supporting");
  };

  if (!isBlocking) {
    return null;
  }

  // Show banner for first few dismissals
  if (!showModal) {
    return <AdBlockBanner onDismiss={handleBannerDismiss} />;
  }

  // Show modal after threshold
  return (
    <div
      onClick={handleBackdropClick}
      className="bg-overlay-bg fixed inset-0 z-[2147483647] flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="modal-container border-button-info bg-secondary-bg mx-auto w-full max-w-[720px] overflow-hidden rounded-lg border shadow-lg">
        {/* Close button */}
        <button
          onClick={handleModalDismiss}
          className="text-secondary-text hover:text-primary-text absolute top-4 right-4 z-10 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="px-6 py-8 text-center md:px-12 md:py-10">
          {/* Logo */}
          <div className="mb-4 md:mb-6">
            <Image
              src={`https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent_${resolvedTheme === "dark" ? "Dark" : "Light"}.webp`}
              alt="JBCL Logo"
              width={600}
              height={100}
              unoptimized
              className="mx-auto h-auto w-full max-w-[300px]"
            />
          </div>

          {/* Title */}
          <h2 className="text-primary-text mb-3 text-lg font-bold md:mb-4 md:text-xl">
            Support the JBCL Project
          </h2>

          {/* Message */}
          <p className="text-secondary-text mb-6 text-sm leading-relaxed md:mb-8 md:text-base">
            Please whitelist our site in your ad blocker, or become a supporter
            to browse ad‑free and unlock extra perks. This prompt works best
            with Chrome-based browsers and standard adblockers. Firefox users
            with strict tracking protection or newer adblockers may still see
            this message after whitelisting.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={handleSupporterClick}
              className="bg-button-info text-form-button-text hover:bg-button-info-hover w-full cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition-all sm:w-auto md:px-6 md:py-3 md:text-base"
            >
              Become A Supporter
            </button>
            <button
              onClick={handleModalDismiss}
              className="border-border-primary bg-tertiary-bg text-secondary-text hover:bg-primary-bg hover:text-primary-text w-full cursor-pointer rounded-lg border px-5 py-2.5 text-sm font-medium transition-all sm:w-auto md:px-6 md:py-3 md:text-base"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBlockPrompt;
