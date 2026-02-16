"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useMediaQuery } from "@mui/material";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { removeAdReference } from "@/utils/nitroAds";

const VIDEO_PLAYER_ID = "np-video-player";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: unknown) => Promise<void>;
  removeAd?: (id: string) => void;
};

function useMobileSheetOpen() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }
      const handler = () => onStoreChange();
      window.addEventListener("jb-sheet-toggle", handler);
      return () => {
        window.removeEventListener("jb-sheet-toggle", handler);
      };
    },
    () =>
      typeof document === "undefined"
        ? ""
        : (document.body?.dataset.mobileSheetOpen ?? ""),
    () => "",
  );
}

function useItemSheetOpen() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }
      const handler = () => onStoreChange();
      window.addEventListener("jb-sheet-toggle", handler);
      return () => {
        window.removeEventListener("jb-sheet-toggle", handler);
      };
    },
    () =>
      typeof document === "undefined"
        ? ""
        : (document.body?.dataset.itemSheetOpen ?? ""),
    () => "",
  );
}

export default function NitroVideoPlayer() {
  const { user } = useAuthContext();
  const pathname = usePathname();
  const createdRef = useRef(false);
  const isSheetScreen = useMediaQuery("(max-width: 1024px)");
  const mobileSheetState = useMobileSheetOpen();
  const itemSheetState = useItemSheetOpen();
  const isMobileSheetOpen = mobileSheetState === "true";
  const isItemSheetOpen = itemSheetState === "true";

  const disableFloatingPlayer = useMemo(
    () => isItemSheetOpen || (isSheetScreen && isMobileSheetOpen),
    [isItemSheetOpen, isSheetScreen, isMobileSheetOpen],
  );

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = tier >= 2 && tier <= 3;

    const hasDedicatedVideoNcPlayer =
      pathname === "/values" ||
      pathname === "/robberies" ||
      pathname === "/values/calculator";

    const shouldSuppressFloatingPlayer =
      isSupporter || hasDedicatedVideoNcPlayer || disableFloatingPlayer;

    const removeFloatingPlayer = () => {
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
        attributes: true,
      });

      const interval = window.setInterval(removeFloatingPlayer, 250);

      return () => {
        observer.disconnect();
        window.clearInterval(interval);
      };
    }

    if (createdRef.current) return;

    const nitroAds = (window.nitroAds ?? undefined) as
      | NitroAdsWithRemove
      | undefined;
    if (!nitroAds?.createAd) return;

    createdRef.current = true;

    Promise.resolve(
      nitroAds.createAd(VIDEO_PLAYER_ID, {
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
      }),
    ).catch(() => {
      createdRef.current = false;
    });
  }, [user?.premiumtype, pathname, disableFloatingPlayer]);

  return null;
}
