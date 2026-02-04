"use client";

import Link from "next/link";
import { isFeatureEnabled } from "@/utils/featureFlags";

export default function ServiceAvailabilityTicker() {
  // Check if service availability ticker should be shown using feature flags
  const shouldShowTicker = isFeatureEnabled("SERVICE_AVAILABILITY_TICKER");

  if (!shouldShowTicker) return null;

  return (
    <div className="from-status-warning/20 to-status-warning/10 bg-linear-to-r backdrop-blur-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="relative flex flex-col items-center justify-center gap-2 lg:flex-row lg:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-status-warning text-xs font-semibold">
              SERVICE ALERT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-primary-text text-center text-xs">
              <strong>Bank Truck Tracker:</strong> Bank Trucks are temporarily
              unavailable on the{" "}
              <Link
                href="/robberies"
                prefetch={false}
                className="text-link hover:underline"
              >
                robbery tracker
              </Link>{" "}
              due to technical issues. All other robbery tracking services
              remain functional.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
