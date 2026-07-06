"use client";

import Link from "next/link";
import { isFeatureEnabled } from "@/utils/api/featureFlags";

export default function ServiceAvailabilityTicker() {
  // Check if service availability ticker should be shown using feature flags
  const shouldShowTicker = isFeatureEnabled("SERVICE_AVAILABILITY_TICKER");

  if (!shouldShowTicker) return null;

  return (
    <div className="from-status-warning/20 to-status-warning/10 bg-linear-to-r">
      <div className="container mx-auto px-4 py-2">
        <div className="relative flex flex-col items-center justify-center gap-2 lg:flex-row lg:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-status-warning text-xs font-semibold">
              SERVICE ALERT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-primary-text text-center text-xs">
              Inventories API is down — inventory lookups, OG finder, dupe
              finder, robbery and bounty tracking are affected while we look
              into it. Check{" "}
              <Link
                href="https://status.jailbreakchangelogs.com/"
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:underline"
              >
                our status page
              </Link>{" "}
              for updates.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
