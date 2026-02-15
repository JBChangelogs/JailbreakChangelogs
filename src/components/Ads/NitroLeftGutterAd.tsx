"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@mui/material";
import type { NitroAdInstance } from "@/utils/nitroAds";
import { registerAdInstance, removeAdReference } from "@/utils/nitroAds";

type AdSize = [string, string];

type NitroAdsWithApi = {
  createAd?: (id: string, options: Record<string, unknown>) => unknown;
  removeAd?: (id: string) => void;
};

interface NitroLeftGutterAdProps {
  premiumType?: number;
  adIdSmall: string;
  adIdWide: string;
  smallSizes?: AdSize[];
  wideSizes?: AdSize[];
}

const DEFAULT_SMALL_SIZES: AdSize[] = [["160", "600"]];
const DEFAULT_WIDE_SIZES: AdSize[] = [
  ["300", "600"],
  ["300", "250"],
  ["320", "50"],
  ["320", "100"],
  ["320", "480"],
  ["160", "600"],
];

export default function NitroLeftGutterAd({
  premiumType,
  adIdSmall,
  adIdWide,
  smallSizes = DEFAULT_SMALL_SIZES,
  wideSizes = DEFAULT_WIDE_SIZES,
}: NitroLeftGutterAdProps) {
  const isSmallViewport = useMediaQuery(
    "(min-width: 1900px) and (max-width: 2149px)",
  );
  const isWideViewport = useMediaQuery("(min-width: 2150px)");
  const smallCreatedRef = useRef(false);
  const wideCreatedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tier = premiumType ?? 0;
    const isSupporter = tier >= 2 && tier <= 3;
    const ads = window.nitroAds as unknown as NitroAdsWithApi;

    const removeSlot = (id: string) => {
      removeAdReference(id);
      ads?.removeAd?.(id);
      const el = document.getElementById(id);
      if (el && !ads?.removeAd) {
        el.innerHTML = "";
      }
    };

    if (isSupporter) {
      const removeAds = () => {
        [adIdSmall, adIdWide].forEach((id) => removeSlot(id));
      };

      removeAds();
      smallCreatedRef.current = false;
      wideCreatedRef.current = false;

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

    if (!ads?.createAd) return;

    if (!isSmallViewport && smallCreatedRef.current) {
      removeSlot(adIdSmall);
      smallCreatedRef.current = false;
    }
    if (!isWideViewport && wideCreatedRef.current) {
      removeSlot(adIdWide);
      wideCreatedRef.current = false;
    }

    if (isSmallViewport && !smallCreatedRef.current) {
      Promise.resolve(
        ads.createAd(adIdSmall, {
          sizes: smallSizes,
          report: {
            enabled: true,
            icon: true,
            wording: "Report Ad",
            position: "bottom-left",
          },
        }),
      )
        .then((adInstance) => {
          if (
            adInstance &&
            typeof adInstance === "object" &&
            "onNavigate" in adInstance &&
            typeof adInstance.onNavigate === "function"
          ) {
            registerAdInstance(adIdSmall, adInstance as NitroAdInstance);
          }
          smallCreatedRef.current = true;
        })
        .catch(() => {
          smallCreatedRef.current = false;
        });
    }

    if (isWideViewport && !wideCreatedRef.current) {
      Promise.resolve(
        ads.createAd(adIdWide, {
          sizes: wideSizes,
          report: {
            enabled: true,
            icon: true,
            wording: "Report Ad",
            position: "bottom-left",
          },
        }),
      )
        .then((adInstance) => {
          if (
            adInstance &&
            typeof adInstance === "object" &&
            "onNavigate" in adInstance &&
            typeof adInstance.onNavigate === "function"
          ) {
            registerAdInstance(adIdWide, adInstance as NitroAdInstance);
          }
          wideCreatedRef.current = true;
        })
        .catch(() => {
          wideCreatedRef.current = false;
        });
    }

    return () => {
      removeSlot(adIdSmall);
      removeSlot(adIdWide);
      smallCreatedRef.current = false;
      wideCreatedRef.current = false;
    };
  }, [
    premiumType,
    adIdSmall,
    adIdWide,
    isSmallViewport,
    isWideViewport,
    smallSizes,
    wideSizes,
  ]);

  const tier = premiumType ?? 0;
  const isSupporter = tier >= 2 && tier <= 3;

  if (isSupporter) return null;

  return (
    <>
      <div className="fixed top-1/2 left-[10px] z-[2147483644] hidden -translate-y-1/2 [@media(min-width:1900px)]:block [@media(min-width:2150px)]:hidden">
        <div
          id={adIdSmall}
          className="relative min-h-[600px] w-[160px] text-center text-[0px]"
        />
      </div>
      <div className="fixed top-1/2 left-[10px] z-[2147483644] hidden -translate-y-1/2 [@media(min-width:2150px)]:block">
        <div
          id={adIdWide}
          className="relative min-h-[600px] w-[300px] text-center text-[0px]"
        />
      </div>
    </>
  );
}
