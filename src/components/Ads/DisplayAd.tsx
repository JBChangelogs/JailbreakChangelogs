"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Monitor ad status and show fallback if needed
  useEffect(() => {
    const element = adRef.current;
    if (!element) return;

    // Set a timeout to show fallback if ad doesn't load
    timeoutRef.current = window.setTimeout(() => {
      if (showFallback && element.getAttribute("data-ad-status") !== "filled") {
        setShowSupportMessage(true);
      }
    }, 8000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [showFallback]);

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
