"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-og-rail";
const AD_ID_WIDE = "np-og-rail-wide";

export default function NitroOGRailAd() {
  const { user } = useAuthContext();

  return (
    <NitroLeftGutterAd
      premiumType={user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
    />
  );
}
