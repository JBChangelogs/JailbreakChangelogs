"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type NitroAdConfig = {
  sizes: string[][];
  report: {
    enabled: boolean;
    icon: boolean;
    wording: string;
    position: string;
  };
  mediaQuery: string;
};

type NitroAdsWithRemove = {
  createAd?: (id: string, config: NitroAdConfig) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-dupe-finder";

const AD_CONFIG = {
  sizes: [
    ["300", "250"],
    ["320", "100"],
    ["320", "50"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "bottom-right",
  },
  mediaQuery:
    "(min-width: 1025px), (min-width: 768px) and (max-width: 1024px), (min-width: 320px) and (max-width: 767px)",
};

interface Props {
  className?: string;
}

export default function NitroDupeFinderAd({ className }: Props) {
  const { user } = useAuthContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const createdRef = useRef(false);
  const tier = user?.premiumtype ?? 0;
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

    nitroAds.createAd(SLOT_ID, AD_CONFIG).catch(() => {});

    return () => {
      nitroAds?.removeAd?.(SLOT_ID);
      clearContainer();
      createdRef.current = false;
    };
  }, [isSupporter]);

  if (isSupporter) {
    return null;
  }

  return (
    <div className={`flex justify-center ${className || ""}`}>
      <div id={SLOT_ID} ref={containerRef} />
    </div>
  );
}
