"use client";

import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";
import { fetchTotalRobberiesLogged } from "@/utils/api";

export default function TotalRobberiesLoggedPolling({
  className,
}: {
  className?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["robberies-total-logged"],
    queryFn: fetchTotalRobberiesLogged,
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  const displayValue = typeof data === "number" ? data.toLocaleString() : "0";

  return (
    <div
      className={cn(
        "border-border-card bg-secondary-bg/70 inline-flex items-center gap-4 rounded-xl border px-4 py-3 shadow-sm backdrop-blur",
        className,
      )}
      aria-label="Total robberies logged"
    >
      <div className="bg-tertiary-bg text-primary-text flex h-10 w-10 items-center justify-center rounded-lg border border-white/5">
        <Icon icon="mdi:clipboard-text-clock" className="h-6 w-6" />
      </div>
      <div className="leading-tight">
        <div className="text-secondary-text text-xs font-medium tracking-wide uppercase">
          Total Logged
        </div>
        <div className="text-primary-text text-lg font-semibold tabular-nums">
          {isLoading ? (
            <span className="bg-button-secondary inline-block h-5 w-28 animate-pulse rounded" />
          ) : (
            <span>{displayValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}
