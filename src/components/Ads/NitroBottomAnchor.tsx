"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

const ANCHOR_ID = "np-bottom-anchor";

export default function NitroBottomAnchor() {
  const { user } = useAuthContext();
  const createdRef = useRef(false);

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = tier >= 1 && tier <= 3;

    if (isSupporter) {
      const el = document.getElementById(ANCHOR_ID);
      if (el) el.style.display = "none";
      return;
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.nitroAds?.createAd) return;

    createdRef.current = true;

    Promise.resolve(
      window.nitroAds.createAd(ANCHOR_ID, {
        format: "anchor-v2",
        anchor: "bottom",
        anchorBgColor: "rgb(0 0 0 / 80%)",
        anchorClose: true,
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
    ).catch(() => {
      createdRef.current = false;
    });
  }, [user?.premiumtype]);

  return null;
}
