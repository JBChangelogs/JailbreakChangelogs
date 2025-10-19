"use client";

import { isFeatureEnabled } from "@/utils/featureFlags";

export default function ServiceAvailabilityTicker() {
  // Check if service availability ticker should be shown using feature flags
  const shouldShowTicker = isFeatureEnabled("SERVICE_AVAILABILITY_TICKER");

  if (!shouldShowTicker) return null;

  return (
    <div className="from-status-warning/10 to-status-warning/5 bg-gradient-to-r">
      <div className="container mx-auto px-4 py-3">
        <div className="relative flex flex-col items-center justify-center gap-3 lg:flex-row lg:gap-4 lg:pr-12">
          <div className="flex items-center gap-2">
            <span className="text-status-warning text-xs font-semibold lg:text-sm">
              SERVICE ALERT
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 lg:flex-row lg:gap-3">
            <span className="text-primary-text text-center text-xs lg:text-sm">
              <strong>Infrastructure Upgrades:</strong> Inventory logging will
              be down as we perform infrastructure upgrades. The following are
              affected - OG Finder, Dupe Finder, polling bots, inventories and
              contracts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
