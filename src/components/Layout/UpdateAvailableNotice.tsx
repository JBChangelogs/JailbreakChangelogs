"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

const BUILD_TIME = Number(process.env.NEXT_PUBLIC_BUILD_TIME) || 0;
const CHECK_INTERVAL_MS = 5 * 60_000;

// True once a newer deploy is live, for users who never navigate (navigation
// already picks up new deploys via deploymentId).
export function useUpdateAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!BUILD_TIME || process.env.NODE_ENV === "development") return;

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { date } = (await res.json()) as { date?: number };
        if (date) setAvailable(date > BUILD_TIME);
      } catch {}
    };

    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return available;
}

export default function UpdateAvailableNotice() {
  return (
    <div role="status" className="bg-secondary-bg">
      <div className="bg-button-info/15 border-button-info/40 text-primary-text flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5 text-center text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Icon
            icon="heroicons:arrow-path"
            className="text-button-info h-4 w-4 shrink-0"
          />
          A new version of the site is available
        </span>
        <Button size="xs" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
