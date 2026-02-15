"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-rail-left-calculator";
const AD_ID_WIDE = "np-rail-left-calculator-wide";

export default function NitroCalculatorRailAd() {
  const { user } = useAuthContext();

  return (
    <NitroLeftGutterAd
      premiumType={user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
    />
  );
}
