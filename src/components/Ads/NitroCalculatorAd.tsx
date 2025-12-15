"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof CALCULATOR_CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-value-calc";

const CALCULATOR_CONFIG = {
  sizes: [
    ["728", "90"],
    ["970", "90"],
    ["320", "50"],
    ["320", "100"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery:
    "(min-width: 1025px), (min-width: 768px) and (max-width: 1024px), (min-width: 320px) and (max-width: 767px)",
};

interface Props {
  className?: string;
}

export default function NitroCalculatorAd({ className }: Props) {
  const { user } = useAuthContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const createdRef = useRef(false);
  const tier = user?.premiumtype ?? 0;
  const isSupporter = tier >= 1 && tier <= 3;

  useEffect(() => {
    const clearContainer = () => {
      if (containerRef.current) {
        containerRef.current.replaceChildren();
      }
    };

    if (isSupporter) {
      clearContainer();
      createdRef.current = false;
      return;
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    const nitroAds = (window.nitroAds ?? undefined) as unknown as
      | NitroAdsWithRemove
      | undefined;
    if (!nitroAds?.createAd) return;
    if (!containerRef.current) return;

    createdRef.current = true;

    nitroAds.createAd(SLOT_ID, CALCULATOR_CONFIG).catch(() => {
      createdRef.current = false;
    });

    return () => {
      nitroAds?.removeAd?.(SLOT_ID);
      clearContainer();
      createdRef.current = false;
    };
  }, [isSupporter]);

  if (isSupporter) {
    return null;
  }

  return <div id={SLOT_ID} ref={containerRef} className={className} />;
}
