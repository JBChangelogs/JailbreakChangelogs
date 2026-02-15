"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-seasons-calculator-rail";
const AD_ID_WIDE = "np-seasons-calculator-rail-wide";

export default function NitroSeasonsCalculatorRailAd() {
  const { user } = useAuthContext();

  return (
    <NitroLeftGutterAd
      premiumType={user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
    />
  );
}
