"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";

export function VoteRateLimitBanner({ until }: { until: number }) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.ceil((until - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  if (secondsLeft === 0) return null;

  return (
    <div className="border-border-card bg-tertiary-bg text-primary-text flex items-center justify-center gap-1.5 border-t px-3 py-1.5 text-xs">
      <Icon
        icon="material-symbols:hourglass-empty-rounded"
        className="h-3.5 w-3.5 shrink-0"
        inline
      />
      Too fast — wait{" "}
      {secondsLeft >= 60
        ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
        : `${secondsLeft}s`}
    </div>
  );
}
