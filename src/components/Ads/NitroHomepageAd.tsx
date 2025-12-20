"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type NitroAdConfig = {
  sizes: string[][];
  report: {
    enabled: boolean;
    icon: boolean;
    wording: string;
    position: string;
  };
  mediaQuery: string;
};

type NitroAdsWithRemove = {
  createAd?: (id: string, config: NitroAdConfig) => Promise<void>;
  removeAd?: (id: string) => void;
};

const SLOT_ID_MOBILE = "np-homepage-mobile";
const SLOT_ID_TABLET = "np-homepage-tablet";
const SLOT_ID_DESKTOP = "np-homepage-desktop";

const MOBILE_CONFIG = {
  sizes: [
    ["320", "50"],
    ["320", "100"],
    ["336", "280"],
    ["300", "250"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery: "(max-width: 767px)",
};

const TABLET_CONFIG = {
  sizes: [
    ["728", "90"],
    ["320", "50"],
    ["320", "100"],
    ["300", "250"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery: "(min-width: 768px) and (max-width: 1023px)",
};

const DESKTOP_CONFIG = {
  sizes: [
    ["970", "250"],
    ["970", "90"],
    ["728", "90"],
    ["320", "50"],
    ["320", "100"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery: "(min-width: 1024px)",
};

interface Props {
  className?: string;
}

export default function NitroHomepageAd({ className }: Props) {
  const { user } = useAuthContext();
  const containerRefMobile = useRef<HTMLDivElement | null>(null);
  const containerRefTablet = useRef<HTMLDivElement | null>(null);
  const containerRefDesktop = useRef<HTMLDivElement | null>(null);
  const createdRef = useRef(false);
  const tier = user?.premiumtype ?? 0;
  const isSupporter = tier >= 2 && tier <= 3;

  useEffect(() => {
    const clearContainers = () => {
      if (containerRefMobile.current) {
        containerRefMobile.current.replaceChildren();
      }
      if (containerRefTablet.current) {
        containerRefTablet.current.replaceChildren();
      }
      if (containerRefDesktop.current) {
        containerRefDesktop.current.replaceChildren();
      }
    };

    if (isSupporter) {
      clearContainers();
      createdRef.current = false;
      return;
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    const nitroAds = (window.nitroAds ?? undefined) as unknown as
      | NitroAdsWithRemove
      | undefined;
    if (!nitroAds?.createAd) return;
    if (
      !containerRefMobile.current ||
      !containerRefTablet.current ||
      !containerRefDesktop.current
    )
      return;

    createdRef.current = true;

    // Mobile config
    nitroAds.createAd(SLOT_ID_MOBILE, MOBILE_CONFIG).catch(() => {});

    // Tablet config
    nitroAds.createAd(SLOT_ID_TABLET, TABLET_CONFIG).catch(() => {});

    // Desktop config
    let desktopConfig = DESKTOP_CONFIG;
    // If the window height is less than 800px, remove the 970x250 ad size to prevent it from touching the bottom anchor ad
    if (window.innerHeight < 800) {
      desktopConfig = {
        ...DESKTOP_CONFIG,
        sizes: DESKTOP_CONFIG.sizes.filter(
          (size) => !(size[0] === "970" && size[1] === "250"),
        ),
      };
    }
    nitroAds.createAd(SLOT_ID_DESKTOP, desktopConfig).catch(() => {});

    return () => {
      nitroAds?.removeAd?.(SLOT_ID_MOBILE);
      nitroAds?.removeAd?.(SLOT_ID_TABLET);
      nitroAds?.removeAd?.(SLOT_ID_DESKTOP);
      clearContainers();
      createdRef.current = false;
    };
  }, [isSupporter]);

  if (isSupporter) {
    return null;
  }

  return (
    <div className={`flex justify-center ${className || ""}`}>
      <div
        id={SLOT_ID_MOBILE}
        ref={containerRefMobile}
        className="block md:hidden"
      />
      <div
        id={SLOT_ID_TABLET}
        ref={containerRefTablet}
        className="hidden md:block lg:hidden"
      />
      <div
        id={SLOT_ID_DESKTOP}
        ref={containerRefDesktop}
        className="hidden lg:block"
      />
    </div>
  );
}
