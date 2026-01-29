"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof VALUES_CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-values-header";

const VALUES_CONFIG = {
  sizes: [
    ["300", "250"],
    ["320", "100"],
    ["320", "50"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery:
    "(min-width: 1025px), (min-width: 768px) and (max-width: 1024px), (min-width: 320px) and (max-width: 767px)",
};

interface Props {
  className?: string;
}

export default function NitroValuesVideoPlayer({ className }: Props) {
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

    try {
      Promise.resolve(nitroAds.createAd(SLOT_ID, VALUES_CONFIG)).catch(
        (error) => {
          console.warn(
            "[Nitro Ad] Failed to create values video player ad:",
            error,
          );
          createdRef.current = false;
        },
      );
    } catch (error) {
      console.warn(
        "[Nitro Ad] Error initializing values video player ad:",
        error,
      );
      createdRef.current = false;
    }

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
