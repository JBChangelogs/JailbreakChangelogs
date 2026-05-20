"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface RateLimitBannerProps {
  until: number | null;
  label?: string;
  className?: string;
}

export function RateLimitBanner({
  until,
  label,
  className,
}: RateLimitBannerProps) {
  const rawId = useId().replace(/:/g, "_");
  const idA = `${rawId}a`;
  const idB = `${rawId}b`;

  const [secondsLeft, setSecondsLeft] = useState(
    until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!until) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  if (!until || secondsLeft <= 0) return null;

  const formatted =
    secondsLeft >= 60
      ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
      : `${secondsLeft}s`;

  return (
    <div
      className={cn(
        "text-primary-text flex items-center gap-2 rounded-lg border border-warning-light/30 bg-warning-light/10 px-3 py-2.5 text-sm",
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary-text h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
      >
        <g>
          <path fill="currentColor" d="M7 3H17V7.2L12 12L7 7.2V3Z">
            <animate
              id={idA}
              fill="freeze"
              attributeName="opacity"
              begin={`0;${idB}.end`}
              dur="2s"
              from="1"
              to="0"
            />
          </path>
          <path fill="currentColor" d="M17 21H7V16.8L12 12L17 16.8V21Z">
            <animate
              fill="freeze"
              attributeName="opacity"
              begin={`0;${idB}.end`}
              dur="2s"
              from="0"
              to="1"
            />
          </path>
          <path
            fill="currentColor"
            d="M6 2V8H6.01L6 8.01L10 12L6 16L6.01 16.01H6V22H18V16.01H17.99L18 16L14 12L18 8.01L17.99 8H18V2H6ZM16 16.5V20H8V16.5L12 12.5L16 16.5ZM12 11.5L8 7.5V4H16V7.5L12 11.5Z"
          />
          <animateTransform
            id={idB}
            attributeName="transform"
            attributeType="XML"
            begin={`${idA}.end`}
            dur="0.5s"
            from="0 12 12"
            to="180 12 12"
            type="rotate"
          />
        </g>
      </svg>
      {label && `${label} `}Try again in{" "}
      <span className="font-semibold tabular-nums">{formatted}</span>
    </div>
  );
}
