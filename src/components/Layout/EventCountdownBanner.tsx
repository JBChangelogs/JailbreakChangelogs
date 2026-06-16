"use client";

import { useState, useEffect } from "react";
import { isFeatureEnabled } from "@/utils/api/featureFlags";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

const REPLAY_1_TIMESTAMP = 1781976300;
const REPLAY_1_LIVE_UNTIL = REPLAY_1_TIMESTAMP + 900; // show "LIVE NOW" for 15 min
const REPLAY_2_TIMESTAMP = 1782071100;
const REPLAY_2_LIVE_UNTIL = REPLAY_2_TIMESTAMP + 900; // show "LIVE NOW" for 15 min
const REPLAY_3_TIMESTAMP = 1782091500;
const REPLAY_1_URL = "https://www.roblox.com/events/6421592384919962212";
const REPLAY_2_URL = "https://www.roblox.com/events/6667625703820886590";
const REPLAY_3_URL = "https://www.roblox.com/events/8810279197240066706";
const GAME_URL = "https://www.roblox.com/games/606849621/Jailbreak";
const DISMISS_KEYS = {
  1: "jailbreak-live-event-replay-1-2026-dismissed",
  2: "jailbreak-live-event-replay-2-2026-dismissed",
  3: "jailbreak-live-event-replay-3-2026-dismissed",
} as const;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

type Phase =
  | { replay: 1; timeLeft: TimeLeft }
  | { replay: "1-live" }
  | { replay: 2; timeLeft: TimeLeft }
  | { replay: "2-live" }
  | { replay: 3; timeLeft: TimeLeft }
  | { replay: "3-live" };

function getPhase(): Phase {
  const now = Math.floor(Date.now() / 1000);

  if (now < REPLAY_1_TIMESTAMP) {
    const diff = REPLAY_1_TIMESTAMP - now;
    return {
      replay: 1,
      timeLeft: {
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        expired: false,
      },
    };
  }

  if (now < REPLAY_1_LIVE_UNTIL) return { replay: "1-live" };

  if (now < REPLAY_2_TIMESTAMP) {
    const diff = REPLAY_2_TIMESTAMP - now;
    return {
      replay: 2,
      timeLeft: {
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        expired: false,
      },
    };
  }

  if (now < REPLAY_2_LIVE_UNTIL) return { replay: "2-live" };

  if (now < REPLAY_3_TIMESTAMP) {
    const diff = REPLAY_3_TIMESTAMP - now;
    return {
      replay: 3,
      timeLeft: {
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        expired: false,
      },
    };
  }

  return { replay: "3-live" };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

const strokeStyle = {
  color: "#d946ef",
  textShadow:
    "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.6)",
  fontWeight: 900,
  letterSpacing: "0.03em",
} as const;

export default function EventCountdownBanner() {
  const shouldShow = isFeatureEnabled("LIVE_EVENT_COUNTDOWN");
  const [dismissedReplays, setDismissedReplays] = useState<Set<number>>(
    new Set(),
  );
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    const dismissed = new Set<number>();
    ([1, 2, 3] as const).forEach((n) => {
      if (safeLocalStorage.getItem(DISMISS_KEYS[n]) === "true")
        dismissed.add(n);
    });
    setDismissedReplays(dismissed);
    setPhase(getPhase());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setPhase(getPhase()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!shouldShow || !phase) return null;

  const isLive =
    phase.replay === "1-live" ||
    phase.replay === "2-live" ||
    phase.replay === "3-live";
  const isCountdown =
    phase.replay === 1 || phase.replay === 2 || phase.replay === 3;
  const replayNum =
    phase.replay === 1 || phase.replay === "1-live"
      ? 1
      : phase.replay === 2 || phase.replay === "2-live"
        ? 2
        : 3;
  const eventUrl =
    replayNum === 1
      ? REPLAY_1_URL
      : replayNum === 2
        ? REPLAY_2_URL
        : REPLAY_3_URL;

  if (dismissedReplays.has(replayNum)) return null;

  const handleDismiss = () => {
    safeLocalStorage.setItem(DISMISS_KEYS[replayNum as 1 | 2 | 3], "true");
    setDismissedReplays((prev) => new Set([...prev, replayNum]));
  };

  const parts: string[] = [];
  if (isCountdown) {
    const { timeLeft } = phase as { replay: 1 | 2 | 3; timeLeft: TimeLeft };
    if (timeLeft.days > 0) parts.push(`${timeLeft.days} days`);
    if (timeLeft.hours > 0) parts.push(`${pad(timeLeft.hours)} hours`);
    parts.push(`${pad(timeLeft.minutes)} minutes`);
    parts.push(`${pad(timeLeft.seconds)} seconds`);
  }

  return (
    <div className="relative border-b border-fuchsia-900/40 bg-zinc-900">
      <div className="px-10 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
          <span
            className="text-xs font-black tracking-widest uppercase"
            style={strokeStyle}
          >
            {isLive ? "🎉 LIVE NOW" : `📺 REPLAY #${replayNum}`}
          </span>

          {isLive ? (
            <>
              <span
                className="text-xs font-semibold whitespace-nowrap"
                style={strokeStyle}
              >
                2026 Live Event Replay #{replayNum} is live!
              </span>
              <a
                href={GAME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold whitespace-nowrap text-white underline transition-opacity hover:opacity-85"
              >
                Join Now
              </a>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold whitespace-nowrap text-zinc-300">
                2026 LIVE EVENT REPLAY #{replayNum}
              </span>
              <span
                className="text-xs whitespace-nowrap tabular-nums"
                style={strokeStyle}
              >
                {parts.join(", ")}
              </span>
              <a
                href={eventUrl}
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
