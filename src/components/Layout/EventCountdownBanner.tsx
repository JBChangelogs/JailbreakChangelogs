"use client";

import { useState, useEffect } from "react";
import { isFeatureEnabled } from "@/utils/api/featureFlags";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

const EVENT_TIMESTAMP = 1781366400;
const EVENT_URL = "https://www.roblox.com/events/2671289784789500577";
const DISMISS_KEY = "jailbreak-live-event-2026-dismissed";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getTimeLeft(): TimeLeft {
  const diff = Math.floor(EVENT_TIMESTAMP - Date.now() / 1000);
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    expired: false,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

const strokeStyle = {
  color: "#ef4444",
  textShadow:
    "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.6)",
  fontWeight: 900,
  letterSpacing: "0.03em",
} as const;

export default function EventCountdownBanner() {
  const shouldShow = isFeatureEnabled("LIVE_EVENT_COUNTDOWN");
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const dismissed = safeLocalStorage.getItem(DISMISS_KEY);
    if (dismissed === "true") {
      setIsVisible(false);
    } else {
      setIsVisible(true);
      setTimeLeft(getTimeLeft());
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    safeLocalStorage.setItem(DISMISS_KEY, "true");
  };

  if (!shouldShow || isVisible !== true || !timeLeft) return null;

  const isLive = timeLeft.expired;

  const parts: string[] = [];
  if (!isLive) {
    if (timeLeft.days > 0) parts.push(`${timeLeft.days} days`);
    if (timeLeft.hours > 0) parts.push(`${pad(timeLeft.hours)} hours`);
    parts.push(`${pad(timeLeft.minutes)} minutes`);
    parts.push(`${pad(timeLeft.seconds)} seconds`);
  }

  return (
    <div className="relative border-b border-red-900/40 bg-zinc-900">
      <div className="px-10 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
          <span
            className="text-xs font-black tracking-widest uppercase"
            style={strokeStyle}
          >
            {isLive ? "🎉 LIVE NOW" : "🚨 LIVE EVENT"}
          </span>

          {isLive ? (
            <>
              <span
                className="text-xs font-semibold whitespace-nowrap"
                style={strokeStyle}
              >
                Enjoy the 2026 Live Event & Update!
              </span>
              <a
                href={EVENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold whitespace-nowrap text-white underline transition-opacity hover:opacity-85"
              >
                Sign Up
              </a>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold whitespace-nowrap text-zinc-300">
                2026 LIVE EVENT & UPDATE
              </span>
              <span
                className="text-xs whitespace-nowrap tabular-nums"
                style={strokeStyle}
              >
                {parts.join(", ")}
              </span>
              <a
                href={EVENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold whitespace-nowrap text-white underline transition-opacity hover:opacity-85"
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-zinc-500 transition-colors hover:text-zinc-200"
        aria-label="Dismiss event countdown"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
