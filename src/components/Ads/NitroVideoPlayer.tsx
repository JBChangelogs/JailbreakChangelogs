"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

const VIDEO_PLAYER_ID = "np-video-player";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: unknown) => Promise<void>;
  removeAd?: (id: string) => void;
};

export default function NitroVideoPlayer() {
  const { user } = useAuthContext();
  const pathname = usePathname();
  const createdRef = useRef(false);

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = tier >= 2 && tier <= 3;

    // Pages that have their own dedicated video-nc players.
    // On these routes, Nitro has requested that the floating player
    // NOT be present at all.
    const hasDedicatedVideoNcPlayer = false;

    const shouldSuppressFloatingPlayer =
      isSupporter || hasDedicatedVideoNcPlayer;

    const removeFloatingPlayer = () => {
      const el = document.getElementById(VIDEO_PLAYER_ID);
      if (el) {
        el.remove();
      }

      const nitroAds = (window.nitroAds ?? undefined) as
        | NitroAdsWithRemove
        | undefined;
      nitroAds?.removeAd?.(VIDEO_PLAYER_ID);

      createdRef.current = false;
    };

    if (typeof window === "undefined") return;

    if (shouldSuppressFloatingPlayer) {
      // Ensure floating player is completely removed on disallowed pages
      // and for supporters, and keep removing it if Nitro tries to
      // recreate it while on these routes.
      removeFloatingPlayer();

      const observer = new MutationObserver(() => {
        removeFloatingPlayer();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        observer.disconnect();
      };
    }

    if (createdRef.current) return;

    const nitroAds = (window.nitroAds ?? undefined) as
      | NitroAdsWithRemove
      | undefined;
    if (!nitroAds?.createAd) return;

    createdRef.current = true;

    nitroAds
      .createAd(VIDEO_PLAYER_ID, {
        format: "floating",
        report: {
          enabled: true,
          icon: true,
          wording: "Report Ad",
          position: "top-left",
        },
        mediaQuery:
          "(min-width: 1025px), (min-width: 768px) and (max-width: 1024px), (min-width: 320px) and (max-width: 767px)",
        video: {
          mobile: "compact",
        },
      })
      .catch(() => {
        createdRef.current = false;
      });
  }, [user?.premiumtype, pathname]);

  return null;
}
