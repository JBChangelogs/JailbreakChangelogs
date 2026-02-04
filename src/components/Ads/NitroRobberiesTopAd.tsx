"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type NitroAdsWithRemove = {
  createAd?: (id: string, config: typeof CONFIG) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID = "np-robberies-top";

const CONFIG = {
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
  mediaQuery: "(min-width: 1025px)",
};

interface Props {
  className?: string;
}

export default function NitroRobberiesTopAd({ className }: Props) {
  const { user } = useAuthContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const createdRef = useRef(false);
  const tier = user?.premiumtype ?? 0;
  // Tier 1 (Supporter) still sees ads, Tier 2 & 3 (Server Booster & Partner) do not
  const isSupporter = tier >= 2 && tier <= 3;

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

    try {
      Promise.resolve(nitroAds.createAd(SLOT_ID, CONFIG)).catch((error) => {
        console.warn("[Nitro Ad] Failed to create robberies top ad:", error);
        createdRef.current = false;
      });
    } catch (error) {
      console.warn("[Nitro Ad] Error initializing robberies top ad:", error);
      createdRef.current = false;
    }

    return () => {
      nitroAds?.removeAd?.(SLOT_ID);
      clearContainer();
      createdRef.current = false;
    };
  }, [isSupporter]);

  if (isSupporter) {
    return null;
  }

  return (
    <div
      id={SLOT_ID}
      ref={containerRef}
      className={`flex justify-center ${className || ""}`}
    />
  );
}
