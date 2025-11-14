"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

interface DisplayAdProps {
  adSlot: string;
  style?: React.CSSProperties;
  className?: string;
  adFormat?: "auto" | "fluid";
  layoutKey?: string;
  showFallback?: boolean;
}

const DisplayAd: React.FC<DisplayAdProps> = ({
  adSlot,
  style = { display: "block" },
  className = "",
  adFormat = "auto",
  layoutKey,
  showFallback = true,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a unique key for route changes (similar to router.asPath in Pages Router)
  const routeKey = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  // Derive fallback state from route changes instead of using setState in effect
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const [lastRouteKey, setLastRouteKey] = useState(routeKey);

  // Reset fallback state when route changes (derived state pattern)
  if (routeKey !== lastRouteKey) {
    setShowSupportMessage(false);
    setLastRouteKey(routeKey);
  }

  useEffect(() => {
    const element = adRef.current;
    if (!element) return;

    const doPush = () => {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    };

    const pushAds = () => {
      try {
        doPush();
      } catch (error) {
        console.warn("Failed to initialize ad:", error);
        // Retry mechanism - critical for SPA navigation
        setTimeout(() => {
          try {
            doPush();
          } catch (retryError) {
            console.error("AdSense push retry failed:", retryError);
          }
        }, 750);
      }
    };

    pushAds();

    // Fallback timeout - only show if ad truly fails to load
    timeoutRef.current = setTimeout(() => {
      if (showFallback && element && !element.querySelector("iframe")) {
        setShowSupportMessage(true);
      }
    }, 8000); // Reduced from 10s to 8s

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [routeKey, showFallback]); // Key dependency: re-run on route changes

  // Fallback: Show branded support message when ad fails to load
  if (showSupportMessage && showFallback) {
    return (
      <div
        className={`bg-secondary-bg flex w-full flex-col items-center justify-center px-6 py-6 text-center ${className}`}
        style={{
          ...style,
          width: "100%",
          minHeight:
            adFormat === "auto"
              ? "250px"
              : adFormat === "fluid"
                ? "450px"
                : "250px",
          height: "100%",
        }}
      >
        <div className="mb-4 flex items-center justify-center">
          <Image
            src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
            alt="JBCL Logo"
            width={56}
            height={56}
            className="h-14 w-14 drop-shadow-lg"
          />
        </div>
        <div className="text-primary-text mb-3 text-base font-semibold">
          Support JBCL
        </div>
        <div className="text-secondary-text mb-4 text-sm leading-relaxed">
          Please consider turning off your ad blocker to support our site!
          <br />
          <a
            href="/supporting"
            className="text-link hover:text-link-hover transition-colors"
          >
            Become a supporter
          </a>{" "}
          to hide ads and get exclusive perks.
        </div>
      </div>
    );
  }

  return (
    <ins
      key={routeKey} // Critical: Forces re-render on route changes
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        minWidth: "250px",
        minHeight:
          adFormat === "auto"
            ? "250px"
            : adFormat === "fluid"
              ? "450px"
              : undefined,
        maxHeight: adFormat === "fluid" ? "500px" : undefined,
        ...style,
      }}
      data-ad-client={`ca-pub-${process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT}`}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      data-full-width-responsive={adFormat === "auto" ? "true" : undefined}
    />
  );
};

export default DisplayAd;
