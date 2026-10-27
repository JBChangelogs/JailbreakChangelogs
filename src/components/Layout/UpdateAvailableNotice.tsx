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
    <div className="from-status-info/15 to-secondary-bg bg-linear-to-r">
      <div className="relative px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-primary-text text-center text-xs">
            A new version of the site is available.{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-link hover:text-link-hover cursor-pointer font-semibold underline"
            >
              Reload
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
