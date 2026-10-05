"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSafeAuthContext } from "@/contexts/AuthContext";
import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";
import {
  getDesktopNavigation,
  subscribeDesktopNavigation,
} from "@/utils/ui/desktopNavigation";
import { createLogger } from "@/services/logger";
import {
  registerAdInstance,
  removeAdReference,
  type NitroAdInstance,
} from "@/utils/analytics/nitroAds";

const log = createLogger("UI");
const CONFIG = {
  sizes: [
    ["970", "90"],
    ["728", "90"],
    ["320", "100"],
    ["320", "50"],
  ],
  mediaQuery: "(min-width: 1536px) and (width < 1900px)",
  renderVisibleOnly: true,
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
};

type NitroAdsWithRemove = {
  createAd?: (id: string, options: Record<string, unknown>) => unknown;
  removeAd?: (id: string) => void;
};

export default function NitroRailFallbackAd({ adId }: { adId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const auth = useSafeAuthContext();
  const navigation = useSyncExternalStore(
    subscribeDesktopNavigation,
    getDesktopNavigation,
    () => "sidebar",
  );
  const isFallbackViewport = useMediaQuery(CONFIG.mediaQuery);
  const eligible =
    !auth?.isLoading &&
    !canHideAdsForPremiumType(auth?.user?.premiumtype) &&
    navigation === "sidebar" &&
    isFallbackViewport;

  useEffect(() => {
    if (!eligible) return;
    const container = containerRef.current;
    let active = true;
    let pending = false;
    const createAd = () => {
      const ads = window.nitroAds as NitroAdsWithRemove | undefined;
      if (!active || pending || !ads?.createAd) return;
      pending = true;
      const failed = (error: unknown) => {
        if (!active) return;
        pending = false;
        log.warn(`[Nitro Ad] Failed to create rail fallback ${adId}:`, error);
      };
      try {
        Promise.resolve(ads.createAd(adId, CONFIG))
          .then((instance) => {
            if (!active) return;
            if (
              instance &&
              typeof instance === "object" &&
              "onNavigate" in instance &&
              typeof instance.onNavigate === "function"
            ) {
              registerAdInstance(adId, instance as NitroAdInstance);
            }
          })
          .catch(failed);
      } catch (error) {
        failed(error);
      }
    };
    document.addEventListener("nitroAds.loaded", createAd);
    createAd();
    return () => {
      active = false;
      document.removeEventListener("nitroAds.loaded", createAd);
      removeAdReference(adId);
      (window.nitroAds as NitroAdsWithRemove | undefined)?.removeAd?.(adId);
      container?.replaceChildren();
    };
  }, [adId, eligible]);

  if (!eligible) return null;

  return (
    <div className="my-6 flex justify-center">
      <div
        id={adId}
        ref={containerRef}
        className="flex min-h-25 w-full justify-center"
      />
    </div>
  );
}
