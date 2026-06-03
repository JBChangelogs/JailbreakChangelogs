"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import type { UserData, UserFlag } from "@/types/auth";

function hasTestingAccess(user: UserData | null): boolean {
  if (!user || !Array.isArray(user.flags)) return false;
  return user.flags.some(
    (flag: UserFlag) =>
      (flag.flag === "is_tester" || flag.flag === "is_owner") &&
      flag.enabled === true,
  );
}

export default function AccessDeniedAutoRedirect() {
  const { user, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;
    if (hasTestingAccess(user)) {
      window.location.replace("/");
    }
  }, [user, isLoading]);

  return null;
}
