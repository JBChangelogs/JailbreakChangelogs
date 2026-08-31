"use client";

import { useSafeAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

type AdSize = [string, string];

interface NitroRailAdProps {
  adIdSmall: string;
  adIdWide: string;
  side?: "left" | "right";
  wideSizes?: AdSize[];
}

export default function NitroRailAd({
  adIdSmall,
  adIdWide,
  side,
  wideSizes,
}: NitroRailAdProps) {
  const authContext = useSafeAuthContext();

  if (authContext?.isLoading) {
    return null;
  }

  return (
    <NitroLeftGutterAd
      premiumType={authContext?.user?.premiumtype}
      adIdSmall={adIdSmall}
      adIdWide={adIdWide}
      side={side}
      wideSizes={wideSizes}
    />
  );
}
