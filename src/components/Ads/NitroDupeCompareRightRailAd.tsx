"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-rail-right-dupe-compare";
const AD_ID_WIDE = "np-rail-right-dupe-compare-wide";

export default function NitroDupeCompareRightRailAd() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return null;
  }

  return (
    <NitroLeftGutterAd
      premiumType={user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
      side="right"
    />
  );
}
