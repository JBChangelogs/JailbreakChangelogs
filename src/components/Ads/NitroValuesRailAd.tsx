"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-rail-left-values";
const AD_ID_WIDE = "np-rail-left-values-wide";

export default function NitroValuesRailAd() {
  const { user } = useAuthContext();

  return (
    <NitroLeftGutterAd
      premiumType={user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
    />
  );
}
