"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-rail-right-robberies";
const AD_ID_WIDE = "np-rail-right-robberies-wide";
const WIDE_SIZES: [string, string][] = [
  ["300", "600"],
  ["300", "250"],
  ["160", "600"],
];

export default function NitroRobberiesRightRailAd() {
  const { user } = useAuthContext();

  return (
    <NitroLeftGutterAd
      premiumType={user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
      wideSizes={WIDE_SIZES}
      side="right"
    />
  );
}
