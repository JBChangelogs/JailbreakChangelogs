"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { registerAdInstance, removeAdReference } from "@/utils/nitroAds";

const AD_ID = "np-rail-left-values";

export default function NitroValuesRailAd() {
  const { user } = useAuthContext();
  const createdRef = useRef(false);

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = tier >= 1 && tier <= 3;

    if (isSupporter) {
      const removeAd = () => {
        const el = document.getElementById(AD_ID);
        if (el) {
          el.remove();
        }
      };

      removeAd();

      // Ensure it doesn't come back if something else triggers it
      const observer = new MutationObserver(() => {
        removeAd();
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

    Promise.resolve(
      window.nitroAds.createAd(AD_ID, {
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
          position: "bottom-right",
        },
        mediaQuery: "(min-width: 1900px)",
      }),
    )
      .then((adInstance) => {
        if (
          adInstance &&
          typeof adInstance === "object" &&
          "onNavigate" in adInstance
        ) {
          registerAdInstance(AD_ID, adInstance);
        }
      })
      .catch(() => {
        createdRef.current = false;
      });

    return () => {
      removeAdReference(AD_ID);
      // For rail ads which are likely attached to body, we should cleanup the element on unmount
      // to prevent it from showing on other pages
      const el = document.getElementById(AD_ID);
      if (el) {
        el.remove();
      }
      createdRef.current = false;
    };
  }, [user?.premiumtype]);

  return null;
}
