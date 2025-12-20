"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-values-top";

const CONFIG = {
  sizes: [
    ["728", "90"],
    ["970", "90"],
    ["320", "50"],
    ["320", "100"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery: "(min-width: 1025px)",
};

interface Props {
  className?: string;
}

export default function NitroValuesTopAd({ className }: Props) {
  const { user } = useAuthContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const createdRef = useRef(false);
  const tier = user?.premiumtype ?? 0;
  // Tier 1 (Supporter) still sees ads, Tier 2 & 3 (Server Booster & Partner) do not
  const isSupporter = tier >= 2 && tier <= 3;

  useEffect(() => {
    const clearContainer = () => {
      if (containerRef.current) {
        containerRef.current.replaceChildren();
      }
    };

    if (isSupporter) {
      clearContainer();
      createdRef.current = false;
      return;
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    const nitroAds = (window.nitroAds ?? undefined) as unknown as
      | NitroAdsWithRemove
      | undefined;
    if (!nitroAds?.createAd) return;
    if (!containerRef.current) return;

    createdRef.current = true;

    nitroAds.createAd(SLOT_ID, CONFIG).catch(() => {
      createdRef.current = false;
    });

    return () => {
      nitroAds?.removeAd?.(SLOT_ID);
      clearContainer();
      createdRef.current = false;
    };
  }, [isSupporter]);

  if (isSupporter) {
    return null;
  }

  // Only render on desktop (lg breakpoint is 1024px usually, but we generally hide div if empty)
  // We can use a utility class to hide it on smaller screens to prevent layout shift or empty space
  // Tailwind 'lg' is usually 1024px. The media query is min-width: 1025px.
  // We'll use 'hidden lg:flex' roughly, but since 1025 is specific, we might just let the ad script handle the showing/hiding logic or use custom CSS/Tailwind arbitrary value if needed.
  // For safety/smoothness, let's just center it.

  return (
    <div
      id={SLOT_ID}
      ref={containerRef}
      className={`flex justify-center ${className || ""}`}
    />
  );
}
