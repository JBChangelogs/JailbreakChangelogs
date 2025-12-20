"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { registerAdInstance, removeAdReference } from "@/utils/nitroAds";

const ANCHOR_ID = "np-bottom-anchor";

export default function NitroBottomAnchor() {
  const { user } = useAuthContext();
  const createdRef = useRef(false);

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = tier >= 2 && tier <= 3;

    if (isSupporter) {
      const removeAd = () => {
        const el = document.getElementById(ANCHOR_ID);
        if (el) {
          el.remove();
        }
      };

      removeAd();

      const observer = new MutationObserver(() => {
        removeAd();
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
      .catch(() => {
        createdRef.current = false;
      });

    // Clean up when component unmounts
    return () => {
      removeAdReference(ANCHOR_ID);
    };
  }, [user?.premiumtype]);

  return null;
}
