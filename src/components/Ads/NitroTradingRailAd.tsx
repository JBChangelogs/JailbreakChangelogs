"use client";

import { useSafeAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-trading-rail";
const AD_ID_WIDE = "np-trading-rail-wide";

export default function NitroTradingRailAd() {
  const authContext = useSafeAuthContext();

  if (authContext?.isLoading) {
    return null;
  }

  return (
    <NitroLeftGutterAd
      premiumType={authContext?.user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
    />
  );
}
