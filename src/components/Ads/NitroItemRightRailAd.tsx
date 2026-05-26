"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import NitroLeftGutterAd from "@/components/Ads/NitroLeftGutterAd";

const AD_ID_SMALL = "np-item-rail-right";
const AD_ID_WIDE = "np-item-rail-right-wide";

export default function NitroItemRightRailAd() {
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
