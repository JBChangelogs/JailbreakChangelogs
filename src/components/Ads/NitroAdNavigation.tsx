"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { refreshAllAds } from "@/utils/analytics/nitroAds";
import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";

export default function NitroAdNavigation() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const { user, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading || previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (!canHideAdsForPremiumType(user?.premiumtype ?? 0)) {
      refreshAllAds();
    }
  }, [pathname, isLoading, user?.premiumtype]);

  return null;
}
