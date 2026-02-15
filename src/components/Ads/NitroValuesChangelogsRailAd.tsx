"use client";

import { useSafeAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-values-changelogs-rail";
const AD_ID_WIDE = "np-values-changelogs-rail-wide";

export default function NitroValuesChangelogsRailAd() {
  const authContext = useSafeAuthContext();

  return (
    <NitroLeftGutterAd
      premiumType={authContext?.user?.premiumtype}
      adIdSmall={AD_ID_SMALL}
      adIdWide={AD_ID_WIDE}
    />
  );
}
