"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof ITEMS_CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-video-player-items";

const ITEMS_CONFIG = {
  format: "video-nc",
  report: {
    enabled: true,
    icon: false,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery:
    "(min-width: 1025px), (min-width: 768px) and (max-width: 1024px), (min-width: 320px) and (max-width: 767px)",
  video: {
    initialDelay: 2,
    mobile: "compact",
  },
};

interface Props {
  className?: string;
}

export default function NitroItemsVideoPlayer({ className }: Props) {
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

    nitroAds.createAd(SLOT_ID, ITEMS_CONFIG).catch(() => {
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

  // Apply min-height to prevent CLS
  return (
    <div
      id={SLOT_ID}
      ref={containerRef}
      className={className}
      style={{ minHeight: "250px" }}
    />
  );
}
