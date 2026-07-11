"use client";

import Link from "next/link";
import type { ServiceAlert } from "@/utils/api/runtimeFlags";

export default function ServiceAvailabilityTicker({
  alert,
}: {
  alert: ServiceAlert | null;
}) {
  if (!alert) return null;

  return (
    <div className="bg-secondary-bg border-status-warning/40 border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="relative flex flex-col items-center justify-center gap-2 lg:flex-row lg:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-status-warning text-xs font-semibold">
              SERVICE ALERT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-primary-text text-center text-xs">
              {alert.message}
              {alert.linkText && alert.linkUrl && (
                <>
                  {" "}
                  <Link
                    href={alert.linkUrl}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:underline"
                  >
                    {alert.linkText}
                  </Link>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
