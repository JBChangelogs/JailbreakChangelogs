"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { registerAdInstance, removeAdReference } from "@/utils/nitroAds";

const AD_ID_SMALL = "np-rail-left-dupe-detail";
const AD_ID_WIDE = "np-rail-left-dupe-detail-wide";

export default function NitroDupeDetailRailAd() {
  const { user } = useAuthContext();
  const createdRef = useRef(false);

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = tier >= 2 && tier <= 3;

    if (isSupporter) {
      const removeAds = () => {
        [AD_ID_SMALL, AD_ID_WIDE].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
      };

      removeAds();

      // Ensure it doesn't come back if something else triggers it
      const observer = new MutationObserver(() => {
        removeAds();
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
    if (typeof window === "undefined") return;
    if (!window.nitroAds?.createAd) return;

    createdRef.current = true;

    // Small Rail Ad (1080p screens)
    // Fits 160x600
    // Range: 1900px to 2149px
    Promise.resolve(
      window.nitroAds.createAd(AD_ID_SMALL, {
        format: "rail",
        rail: "left",
        railOffsetTop: 0,
        railOffsetBottom: 0,
        railCollisionWhitelist: ["*"],
        railCloseColor: "#666666",
        railSpacing: 10,
        railStack: false,
        railStickyTop: 0,
        railVerticalAlign: "center",
        sizes: [["160", "600"]],
        report: {
          enabled: true,
          icon: true,
          wording: "Report Ad",
          position: "top-center",
        },
        mediaQuery: "(min-width: 1900px) and (max-width: 2149px)",
      }),
    )
      .then((adInstance) => {
        if (
          adInstance &&
          typeof adInstance === "object" &&
          "onNavigate" in adInstance
        ) {
          registerAdInstance(AD_ID_SMALL, adInstance);
        }
      })
      .catch(() => {});

    // Wide Rail Ad (Wider screens)
    // Fits 300x600, 300x250, etc.
    // Range: 2150px+
    Promise.resolve(
      window.nitroAds.createAd(AD_ID_WIDE, {
        format: "rail",
        rail: "left",
        railOffsetTop: 0,
        railOffsetBottom: 0,
        railCollisionWhitelist: ["*"],
        railCloseColor: "#666666",
        railSpacing: 10,
        railStack: false,
        railStickyTop: 0,
        railVerticalAlign: "center",
        sizes: [
          ["300", "600"],
          ["300", "250"],
          ["320", "50"],
          ["320", "100"],
          ["320", "480"],
          ["160", "600"],
        ],
        report: {
          enabled: true,
          icon: true,
          wording: "Report Ad",
          position: "top-center",
        },
        mediaQuery: "(min-width: 2150px)",
      }),
    )
      .then((adInstance) => {
        if (
          adInstance &&
          typeof adInstance === "object" &&
          "onNavigate" in adInstance
        ) {
          registerAdInstance(AD_ID_WIDE, adInstance);
        }
      })
      .catch(() => {});

    return () => {
      removeAdReference(AD_ID_SMALL);
      removeAdReference(AD_ID_WIDE);
      // For rail ads which are likely attached to body, we should cleanup the element on unmount
      // to prevent it from showing on other pages
      [AD_ID_SMALL, AD_ID_WIDE].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      createdRef.current = false;
    };
  }, [user?.premiumtype]);

  return null;
}
