"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

interface NitroGridAdProps {
  adId: string;
  className?: string;
}

export default function NitroGridAd({ adId, className }: NitroGridAdProps) {
  const { user } = useAuthContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const createdRef = useRef(false);

  const tier = user?.premiumtype ?? 0;
  const isSupporter = tier >= 2 && tier <= 3;

  useEffect(() => {
    if (isSupporter) {
      // If user becomes supporter, remove ad if it exists
      const el = document.getElementById(adId);
      if (el) el.remove();
      return;
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is in view, create the ad
            if (!createdRef.current && window.nitroAds?.createAd) {
              createdRef.current = true;
              Promise.resolve(
                window.nitroAds.createAd(adId, {
                  sizes: [
                    ["320", "50"],
                    ["320", "100"],
                    ["300", "250"],
                  ],
                  report: {
                    enabled: true,
                    icon: true,
                    wording: "Report Ad",
                    position: "top-right",
                  },
                  mediaQuery: "(min-width: 320px) and (max-width: 767px)",
                }),
              ).catch(() => {
                createdRef.current = false;
              });
            }
            // Stop observing once triggered
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" }, // Start loading 200px before it comes into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      // Cleanup: Remove the ad when component unmounts
      const ads = window.nitroAds as unknown as {
        removeAd?: (id: string) => void;
      };
      ads?.removeAd?.(adId);
      createdRef.current = false;
    };
  }, [isSupporter, adId]);

  if (isSupporter) {
    return null;
  }

  // Hide on desktop since the ad is configured for mobile only (max-width: 767px)
  // Apply min-height 250px to reserve space for the tallest ad unit (300x250)
  return (
    <div
      id={adId}
      ref={containerRef}
      className={`flex min-h-[250px] justify-center ${className}`}
    />
  );
}
