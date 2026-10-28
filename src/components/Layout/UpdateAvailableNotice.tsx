"use client";

import { useEffect, useState } from "react";

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
    <div className="bg-secondary-bg border-border-card border-b">
      <div className="relative px-4 py-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-primary-text focus-visible:ring-border-focus group flex w-full cursor-pointer flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-sm px-8 text-center text-xs focus-visible:ring-2 focus-visible:outline-none lg:px-12"
        >
          <span className="font-medium">
            A new version of the site is available
          </span>
          <span className="text-link group-hover:text-link-hover font-semibold transition-colors">
            Reload <span aria-hidden="true">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
