"use client";

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
              <strong>Service degradation:</strong> We are experiencing some
              isues and are working to fix them. Certain pages and functionality
              may be slower than usual.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
