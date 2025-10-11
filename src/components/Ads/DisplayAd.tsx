"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface DisplayAdProps {
  adSlot: string; // Google AdSense ad slot ID
  style?: React.CSSProperties;
  className?: string;
  adFormat?: "auto" | "fluid"; // AdSense ad format type
  layoutKey?: string; // Required for in-feed ads to maintain layout
  showFallback?: boolean; // Show support message when ad fails to load
  enableReloading?: boolean; // Enable ad reloading on route changes
}

const DisplayAd: React.FC<DisplayAdProps> = ({
  adSlot,
  style = { display: "block" },
  className = "",
  adFormat = "auto",
  layoutKey,
  showFallback = true,
  enableReloading = true,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const [, setAdLoaded] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const [initializedPath, setInitializedPath] = useState<string | null>(null);
  const currentPath = usePathname() || "";
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const finishedRef = useRef<boolean>(false);
  const scriptLoadedRef = useRef<boolean>(false);

  // Load AdSense script directly to avoid data-nscript attribute
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    // Check if script is already loaded
    if (window.adsbygoogle) {
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT}`;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      scriptLoadedRef.current = true;
    };

    script.onerror = () => {
      console.error("Failed to load AdSense script");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentPath) return;
    if (initializedPath === currentPath) return;
    if (!scriptLoadedRef.current) return; // Wait for script to load

    // Configure container dimensions based on ad format
    if (adRef.current) {
      const container = adRef.current.parentElement;
      if (container) {
        // Ensure container has explicit width and height
        container.style.display = "block";
        container.style.width = "100%";

        if (adFormat === "auto") {
          // Auto ads need minimum dimensions for proper rendering
          container.style.minHeight = "250px";
          container.style.minWidth = "250px";
          container.style.maxWidth = "100%";
        } else if (adFormat === "fluid") {
          // Fluid ads have height constraints to prevent excessive sizing
          container.style.minHeight = "450px";
          container.style.maxHeight = "500px";
          container.style.minWidth = "250px";
          container.style.overflow = "hidden";
        }
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Initialize AdSense ad only once per path
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setInitializedPath(currentPath);
          // Start monitoring ad status via MutationObserver
          const element = adRef.current;
          if (element) {
            finishedRef.current = false;

            const evaluateStatus = () => {
              if (!element || finishedRef.current) return;
              const adStatus = element.getAttribute("data-ad-status");
              if (adStatus === "filled") {
                finishedRef.current = true;
                setAdLoaded(true);
                setShowSupportMessage(false);
                if (observerRef.current) observerRef.current.disconnect();
                if (timeoutRef.current) {
                  window.clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
              } else if (adStatus === "unfilled") {
                finishedRef.current = true;
                if (showFallback) setShowSupportMessage(true);
                if (observerRef.current) observerRef.current.disconnect();
                if (timeoutRef.current) {
                  window.clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
              }
            };

            // Observe attribute changes for immediate reaction
            observerRef.current = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (
                  mutation.type === "attributes" &&
                  mutation.attributeName === "data-ad-status"
                ) {
                  evaluateStatus();
                }
              }
            });
            observerRef.current.observe(element, {
              attributes: true,
              attributeFilter: ["data-ad-status"],
            });

            // Evaluate immediately in case the attribute is already set by the time we attach
            evaluateStatus();

            // Safety timeout in case the attribute never appears (e.g., script blocked)
            timeoutRef.current = window.setTimeout(() => {
              if (!finishedRef.current && showFallback) {
                setShowSupportMessage(true);
              }
              if (observerRef.current) observerRef.current.disconnect();
              timeoutRef.current = null;
            }, 9000);
          }
        } catch {
          // AdSense blocked or unavailable - show support message immediately
          if (showFallback) {
            setShowSupportMessage(true);
          }
        }
      });
    });

    return () => {
      // Cleanup observer and timeout on unmount or path change
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      finishedRef.current = false;
    };
  }, [adFormat, showFallback, currentPath, initializedPath]);

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
        <div className="p-6 text-center">
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
      {...(enableReloading ? { "data-ad": "true" } : {})}
    />
  );
};

export default DisplayAd;
