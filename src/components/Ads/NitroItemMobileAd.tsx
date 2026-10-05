"use client";

import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuthContext } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof ITEMS_CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-item-mobile";

const ITEMS_CONFIG = {
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
  // Match the xl:hidden wrapper on item pages.
  mediaQuery: "(min-width: 320px) and (width < 1280px)",
};

interface Props {
  className?: string;
}

export default function NitroItemMobileAd({ className }: Props) {
  const { user, isLoading } = useAuthContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const createdRef = useRef(false);
  const tallViewport = useMediaQuery("(min-height: 600px)");
  const tier = user?.premiumtype ?? 0;
  const isSupporter = canHideAdsForPremiumType(tier);

  useEffect(() => {
    const clearContainer = () => {
      if (containerRef.current) {
        containerRef.current.replaceChildren();
      }
    };

    if (isLoading) return;

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
      Promise.resolve(
        nitroAds.createAd(SLOT_ID, {
          ...ITEMS_CONFIG,
          sizes: tallViewport
            ? ITEMS_CONFIG.sizes
            : ITEMS_CONFIG.sizes.filter((size) => Number(size[1]) <= 100),
        }),
      ).catch((error) => {
        log.warn("[Nitro Ad] Failed to create items video player ad:", error);
        createdRef.current = false;
      });
    } catch (error) {
      log.warn("[Nitro Ad] Error initializing items video player ad:", error);
      createdRef.current = false;
    }

    return () => {
      nitroAds?.removeAd?.(SLOT_ID);
      clearContainer();
      createdRef.current = false;
    };
  }, [isLoading, isSupporter, tallViewport]);

  if (isLoading || isSupporter) {
    return null;
  }

  // Apply min-height to prevent CLS
  return (
    <div
      id={SLOT_ID}
      ref={containerRef}
      className={className}
      style={{ minHeight: tallViewport ? 250 : 100 }}
    />
  );
}
