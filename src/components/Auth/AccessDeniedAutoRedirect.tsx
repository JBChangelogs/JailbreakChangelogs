"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    let cancelled = false;
    let retryTimeout: number | undefined;

    const check = async (attempt: number) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-store",
          },
        });

        if (!response.ok) return;

        const data = (await response.json()) as { user: UserData | null };
        if (cancelled) return;

        if (hasTestingAccess(data.user)) {
          window.location.replace("/");
        }
      } catch {
        // ignore
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (cancelled) return;
      if (attempt >= 2) return;

      retryTimeout = window.setTimeout(
        () => {
          void check(attempt + 1);
        },
        400 * Math.pow(2, attempt),
      );
    };

    void check(0);

    return () => {
      cancelled = true;
      if (retryTimeout) window.clearTimeout(retryTimeout);
    };
  }, []);

  return null;
}
