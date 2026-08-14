"use client";

import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";
import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof ITEMS_CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-item-video";

const ITEMS_CONFIG = {
  format: "video-nc",
  video: {
    mobile: "compact",
    hidePlaylist: true,
  },
};

interface Props {
  className?: string;
}

export default function NitroItemsVideoPlayer({ className }: Props) {
  const { user, isLoading } = useAuthContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const createdRef = useRef(false);
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
      Promise.resolve(nitroAds.createAd(SLOT_ID, ITEMS_CONFIG)).catch(
        (error) => {
          log.warn("[Nitro Ad] Failed to create items video player ad:", error);
          createdRef.current = false;
        },
      );
    } catch (error) {
      log.warn("[Nitro Ad] Error initializing items video player ad:", error);
      createdRef.current = false;
    }

    return () => {
      nitroAds?.removeAd?.(SLOT_ID);
      clearContainer();
      createdRef.current = false;
    };
  }, [isLoading, isSupporter]);

  if (isLoading || isSupporter) {
    return null;
  }

  return (
    <div className={cn("mx-auto w-full max-w-sm", className)}>
      <div className="bg-secondary-background relative aspect-video w-full shrink-0 overflow-hidden rounded-lg">
        <div id={SLOT_ID} ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
