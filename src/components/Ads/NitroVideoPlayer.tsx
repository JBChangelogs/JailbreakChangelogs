"use client";

import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  registerAdInstance,
  removeAdReference,
  type NitroAdInstance,
} from "@/utils/analytics/nitroAds";

const VIDEO_PLAYER_ID = "np-video-player";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: unknown) => Promise<NitroAdInstance>;
  removeAd?: (id: string) => void;
};

export default function NitroVideoPlayer() {
  const { user, isLoading } = useAuthContext();
  const pathname = usePathname();
  const createdRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(
    () => () => {
      generationRef.current++;
      removeAdReference(VIDEO_PLAYER_ID);
    },
    [],
  );

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = canHideAdsForPremiumType(tier);

    // /changelogs/[id] and /seasons/[id] have sibling static routes that
    // don't have a dedicated video-nc player, so exclude those segments.
    const isChangelogDetailRoute =
      pathname.startsWith("/changelogs/") &&
      !pathname.startsWith("/changelogs/timeline");
    const isSeasonDetailRoute =
      pathname.startsWith("/seasons/") &&
      !pathname.startsWith("/seasons/contracts") &&
      !pathname.startsWith("/seasons/leaderboard") &&
      !pathname.startsWith("/seasons/will-i-make-it");

    const hasDedicatedVideoNcPlayer =
      pathname === "/values" ||
      pathname === "/robberies" ||
      pathname === "/values/calculator" ||
      pathname === "/trading" ||
      pathname === "/items/suggestions" ||
      pathname.startsWith("/items/suggestions/") ||
      pathname.startsWith("/items/changelogs/") ||
      pathname.startsWith("/item/") ||
      isChangelogDetailRoute ||
      isSeasonDetailRoute;
    const isMessagesRoute =
      pathname === "/messages" || pathname.startsWith("/messages/");

    const shouldSuppressFloatingPlayer =
      isSupporter || hasDedicatedVideoNcPlayer || isMessagesRoute;

    const removeFloatingPlayer = () => {
      generationRef.current++;
      const el = document.getElementById(VIDEO_PLAYER_ID);
      if (el) {
        el.remove();
      }

      const nitroAds = (window.nitroAds ?? undefined) as
        | NitroAdsWithRemove
        | undefined;
      nitroAds?.removeAd?.(VIDEO_PLAYER_ID);
      removeAdReference(VIDEO_PLAYER_ID);

      createdRef.current = false;
    };

    if (typeof window === "undefined") return;

    // While auth is resolving, don't create the ad yet but don't destroy it either.
    if (isLoading) return;

    if (shouldSuppressFloatingPlayer) {
      removeFloatingPlayer();

      const observer = new MutationObserver(() => {
        if (document.getElementById(VIDEO_PLAYER_ID)) {
          removeFloatingPlayer();
        }
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
    const generation = ++generationRef.current;

    Promise.resolve(
      nitroAds.createAd(VIDEO_PLAYER_ID, {
        format: "floating",
        floating: { position: "right", reduceMobileSize: true },
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
      }),
    )
      .then((adInstance) => {
        if (generation === generationRef.current && adInstance?.onNavigate) {
          registerAdInstance(VIDEO_PLAYER_ID, adInstance);
        }
      })
      .catch(() => {
        if (generation === generationRef.current) createdRef.current = false;
      });
  }, [user?.premiumtype, isLoading, pathname]);

  return null;
}
