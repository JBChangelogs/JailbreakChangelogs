"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

interface NitroGridAdProps {
  adId: string;
  className?: string;
}

export default function NitroGridAd({ adId, className }: NitroGridAdProps) {
  const { user } = useAuthContext();
  const createdRef = useRef(false);

  const tier = user?.premiumtype ?? 0;
  const isSupporter = tier >= 1 && tier <= 3;

  useEffect(() => {
    if (isSupporter) {
      // If user becomes supporter, remove ad if it exists
      const el = document.getElementById(adId);
      if (el) el.remove();
      return;
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.nitroAds?.createAd) return;

    createdRef.current = true;

    window.nitroAds
      .createAd(adId, {
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
      })
      .catch(() => {
        createdRef.current = false;
      });

    return () => {
      // Cleanup: Remove the ad when component unmounts (e.g. pagination change)
      // This is important because we reuse IDs (e.g. np-value-grid-5) on the next page
      // Use type assertion to silence TS if removeAd is missing from global definition
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
  return <div id={adId} className={`flex justify-center ${className}`} />;
}
