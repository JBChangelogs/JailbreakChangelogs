"use client";

import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  registerAdInstance,
  removeAdReference,
} from "@/utils/analytics/nitroAds";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

const ANCHOR_ID = "np-bottom-anchor";

export default function NitroBottomAnchor() {
  const { user, isLoading } = useAuthContext();
  const pathname = usePathname();
  const createdRef = useRef(false);
  const isAccessDeniedRoute = pathname === "/access-denied";

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = canHideAdsForPremiumType(tier);

    if (isLoading) return;

    if (isAccessDeniedRoute) {
      const el = document.getElementById(ANCHOR_ID);
      if (el) {
        el.remove();
      }
      removeAdReference(ANCHOR_ID);
      createdRef.current = false;
      return;
    }

    if (isSupporter) {
      const removeAd = () => {
        const el = document.getElementById(ANCHOR_ID);
        if (el) {
          el.remove();
        }
      };

      removeAd();

      const observer = new MutationObserver(() => {
        if (document.getElementById(ANCHOR_ID)) {
          removeAd();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      createdRef.current = false;
      return () => {
        observer.disconnect();
      };
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.nitroAds?.createAd) return;

    createdRef.current = true;

    try {
      Promise.resolve(
        window.nitroAds.createAd(ANCHOR_ID, {
          format: "anchor-v2",
          anchor: "bottom",
          anchorBgColor: "rgb(0 0 0 / 0%)",
          anchorClose: false,
          anchorPersistClose: false,
          anchorStickyOffset: 0,
          report: {
            enabled: true,
            icon: true,
            wording: "Report Ad",
            position: "top-right",
          },
          mediaQuery:
            "(min-width: 1025px), (min-width: 768px) and (max-width: 1024px), (min-width: 320px) and (max-width: 767px)",
        }),
      )
        .then((adInstance) => {
          // Register this ad instance so we can call onNavigate on it later
          if (
            adInstance &&
            typeof adInstance === "object" &&
            "onNavigate" in adInstance
          ) {
            registerAdInstance(ANCHOR_ID, adInstance);
          }
        })
        .catch((error) => {
          // Silently handle ad creation errors per Nitropay best practices
          log.warn(`[Nitro Ad] Failed to create bottom anchor ad:`, error);
          createdRef.current = false;
        });
    } catch (error) {
      // Catch synchronous errors
      log.warn(`[Nitro Ad] Error initializing bottom anchor ad:`, error);
      createdRef.current = false;
    }

    // Clean up when component unmounts
    return () => {
      removeAdReference(ANCHOR_ID);
    };
  }, [user?.premiumtype, isLoading, isAccessDeniedRoute]);

  return null;
}
