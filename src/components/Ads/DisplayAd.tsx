"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface DisplayAdProps {
  adSlot: string; // Google AdSense ad slot ID
  style?: React.CSSProperties;
  className?: string;
  adFormat?: "auto" | "fluid"; // AdSense ad format type
  layoutKey?: string; // Required for in-feed ads to maintain layout
  showFallback?: boolean; // Show support message when ad fails to load
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
  const [, setAdLoaded] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use current path as key to prevent React from re-rendering ads unnecessarily
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    // Only initialize once per path change to prevent duplicate ad requests
    if (hasInitialized) return;

    // Configure container dimensions based on ad format
    if (adRef.current) {
      const container = adRef.current.parentElement;
      if (container) {
        if (adFormat === "auto") {
          // Auto ads need minimum dimensions for proper rendering
          container.style.minHeight = "250px";
          container.style.minWidth = "300px";
        } else if (adFormat === "fluid") {
          // Fluid ads have height constraints to prevent excessive sizing
          container.style.minHeight = "450px";
          container.style.maxHeight = "500px";
          container.style.overflow = "hidden";
        }
      }
    }

    // Official Google AdSense method for detecting ad load status
    const checkAdStatus = () => {
      if (adRef.current) {
        const adStatus = adRef.current.getAttribute("data-ad-status");

        if (adStatus === "filled") {
          setAdLoaded(true);
          setShowSupportMessage(false);
        } else if (adStatus === "unfilled") {
          // No ad inventory available or ad blocked - show support message
          if (showFallback) {
            setShowSupportMessage(true);
          }
        } else {
          // Ad still loading, check again in 1 second
          setTimeout(checkAdStatus, 1000);
        }
      }
    };

    // Initialize AdSense ad only once per path
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setHasInitialized(true);
      // Start monitoring ad status after AdSense initialization
      setTimeout(checkAdStatus, 500);
    } catch {
      // AdSense blocked or unavailable - show support message immediately
      if (showFallback) {
        setShowSupportMessage(true);
      }
    }
  }, [adFormat, showFallback, currentPath, hasInitialized]);

  // Fallback: Show branded support message when ad fails to load
  if (showSupportMessage && showFallback) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          ...style,
          minHeight:
            adFormat === "auto"
              ? "250px"
              : adFormat === "fluid"
                ? "450px"
                : "250px",
          height: "100%",
        }}
      >
        <div className="from-button-info/10 to-button-info/5 border-button-info/20 rounded-lg border bg-gradient-to-br p-6 text-center shadow-lg">
          <div className="mb-4 flex items-center justify-center">
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
              alt="JBCL Logo"
              width={56}
              height={56}
              className="h-14 w-14 drop-shadow-lg"
            />
          </div>
          <div className="text-primary-text mb-3 flex items-center justify-center gap-2 text-base font-semibold">
            Support JBCL{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className="inline"
            >
              <path
                fill="#1d80e2"
                fillOpacity="0"
                d="M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9c0 0 -7.43 -7.79 -8.24 -9c-0.48 -0.71 -0.76 -1.57 -0.76 -2.5c0 -2.49 2.01 -4.5 4.5 -4.5c1.56 0 2.87 0.84 3.74 2c0.76 1 0.76 1 0.76 1Z"
              >
                <animate
                  fill="freeze"
                  attributeName="fill-opacity"
                  begin="0.7s"
                  dur="0.5s"
                  values="0;1"
                />
              </path>
              <path
                fill="none"
                stroke="#1d80e2"
                strokeDasharray="32"
                strokeDashoffset="32"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c0 0 0 0 -0.76 -1c-0.88 -1.16 -2.18 -2 -3.74 -2c-2.49 0 -4.5 2.01 -4.5 4.5c0 0.93 0.28 1.79 0.76 2.5c0.81 1.21 8.24 9 8.24 9M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9"
              >
                <animate
                  fill="freeze"
                  attributeName="stroke-dashoffset"
                  dur="0.7s"
                  values="32;0"
                />
              </path>
            </svg>
          </div>
          <div className="text-secondary-text mb-4 text-sm leading-relaxed">
            We&apos;re a small team! Ads help cover costs like Discord bots,
            database, APIs, website hosting, domain fees and more.
            <br />
            Become a supporter today to hide ads across all pages and get sweet
            perks!
          </div>
          <a
            href="/supporting"
            className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            View Perks
          </a>
        </div>
      </div>
    );
  }

  return (
    <ins
      key={`${currentPath}-${adSlot}`}
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        minHeight:
          adFormat === "auto"
            ? "250px"
            : adFormat === "fluid"
              ? "450px"
              : undefined,
        maxHeight: adFormat === "fluid" ? "500px" : undefined,
        ...style,
      }}
      data-ad-client="ca-pub-8152532464536367"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      data-full-width-responsive={adFormat === "auto" ? "true" : undefined}
    />
  );
};

export default DisplayAd;
