"use client";

import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";
import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

const CONFIG = {
  format: "video-nc",
  video: {
    mobile: "compact",
    hidePlaylist: true,
  },
};

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

interface Props {
  slotId: string;
  className?: string;
  /**
   * "default" matches most inline placements (compact centered card).
   * "wide" matches the suggestion-detail sidebar layout.
   */
  variant?: "default" | "wide";
}

export default function NitroInlineVideoPlayer({
  slotId,
  className,
  variant = "default",
}: Props) {
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
      Promise.resolve(nitroAds.createAd(slotId, CONFIG)).catch((error) => {
        log.warn(
          `[Nitro Ad] Failed to create ${slotId} video player ad:`,
          error,
        );
        createdRef.current = false;
      });
    } catch (error) {
      log.warn(
        `[Nitro Ad] Error initializing ${slotId} video player ad:`,
        error,
      );
      createdRef.current = false;
    }

    return () => {
      nitroAds?.removeAd?.(slotId);
      clearContainer();
      createdRef.current = false;
    };
  }, [isLoading, isSupporter, slotId]);

  if (isLoading || isSupporter) {
    return null;
  }

  if (variant === "wide") {
    return (
      <div
        className={cn(
          "flex w-full basis-full items-center justify-center p-4 lg:w-96 lg:basis-auto lg:shrink-0",
          className,
        )}
      >
        <div className="w-full max-w-[440px] lg:max-w-none">
          <div className="bg-secondary-background relative aspect-video w-full overflow-hidden rounded-lg">
            <div id={slotId} ref={containerRef} className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-sm", className)}>
      <div className="bg-secondary-background relative aspect-video w-full shrink-0 overflow-hidden rounded-lg">
        <div id={slotId} ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
