"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// Weekly contracts reset every Monday at 17:00 UTC
const RESET_WEEKDAY = 1;
const RESET_HOUR = 17;
const RESET_MINUTE = 0;
const RESET_SECOND = 0;

// Daily XP reset at 13:00 UTC
const DAILY_RESET_HOUR = 13;
const DAILY_RESET_MINUTE = 0;
const DAILY_RESET_SECOND = 0;

function getNextResetTimestamp(now: Date): number {
  const current = new Date(now);

  // Start from today at reset time
  const next = new Date(
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
      RESET_HOUR,
      RESET_MINUTE,
      RESET_SECOND,
      0,
    ),
  );

  const utcDay = next.getUTCDay();
  const daysUntilMonday = (RESET_WEEKDAY - utcDay + 7) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);

  // If we're already past this week's reset time, jump to next week
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }

  return Math.floor(next.getTime() / 1000);
}

function getNextDailyResetTimestamp(now: Date): number {
  const current = new Date(now);

  const next = new Date(
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
      DAILY_RESET_HOUR,
      DAILY_RESET_MINUTE,
      DAILY_RESET_SECOND,
      0,
    ),
  );

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return Math.floor(next.getTime() / 1000);
}

function formatTime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  const dLabel = days === 1 ? "day" : "days";
  const hLabel = hours === 1 ? "hour" : "hours";
  const mLabel = minutes === 1 ? "minute" : "minutes";
  const sLabel = secs === 1 ? "second" : "seconds";
  return `${days} ${dLabel} ${hours} ${hLabel} ${minutes} ${mLabel} ${secs} ${sLabel}`;
}

interface WeeklyContractsCountdownProps {
  season?: {
    season: number;
    title: string;
  } | null;
}

const WeeklyContractsCountdown: React.FC<WeeklyContractsCountdownProps> = ({
  season,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [nextResetUnix, setNextResetUnix] = useState<number>(() =>
    getNextResetTimestamp(new Date()),
  );
  const [dailySecondsLeft, setDailySecondsLeft] = useState<number>(0);
  const [nextDailyResetUnix, setNextDailyResetUnix] = useState<number>(() =>
    getNextDailyResetTimestamp(new Date()),
  );

  const localResetTime = React.useMemo(() => {
    try {
      const date = new Date(nextResetUnix * 1000);
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return "5:00 PM";
    }
  }, [nextResetUnix]);

  const localDailyResetTime = React.useMemo(() => {
    try {
      const date = new Date(nextDailyResetUnix * 1000);
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return "1:00 PM";
    }
  }, [nextDailyResetUnix]);

  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      let delta = nextResetUnix - now;
      if (delta <= 0) {
        const newNext = getNextResetTimestamp(new Date());
        setNextResetUnix(newNext);
        delta = newNext - now;
      }
      setSecondsLeft(delta > 0 ? delta : 0);

      // Daily XP countdown
      let dailyDelta = nextDailyResetUnix - now;
      if (dailyDelta <= 0) {
        const newNextDaily = getNextDailyResetTimestamp(new Date());
        setNextDailyResetUnix(newNextDaily);
        dailyDelta = newNextDaily - now;
      }
      setDailySecondsLeft(dailyDelta > 0 ? dailyDelta : 0);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextResetUnix, nextDailyResetUnix]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#37424D] bg-[#212A31] p-6 shadow-2xl">
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold tracking-wide text-white">
            WEEKLY CONTRACTS
          </h2>
          {season && (
            <div className="mb-2">
              <span className="text-lg font-semibold text-white">
                Season {season.season} / {season.title}
              </span>
            </div>
          )}
          <p className="mb-4 text-sm leading-relaxed text-[#D3D9D4]">
            View the current weekly contracts available in Roblox Jailbreak.
            Check what contracts you need to complete to earn XP and progress
            through this season.
          </p>

          {/* View Rewards Button */}
          <div className="flex justify-center">
            <Link
              href={`/seasons/${season?.season}`}
              className="rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4]"
            >
              View Season Rewards
            </Link>
          </div>
        </div>

        {/* Timer Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Weekly Contracts Timer */}
          <div className="rounded-xl border border-[#37424D] bg-[#2E3944] p-4">
            <div className="text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-sm font-semibold tracking-wide text-white uppercase">
                  New Contracts In
                </span>
              </div>
              <div className="mb-3 rounded-lg bg-[#2E3944] p-3">
                <span className="font-mono text-2xl font-bold text-white">
                  {formatTime(secondsLeft)}
                </span>
              </div>
              <div className="text-xs text-[#D3D9D4]">
                Resets every Monday at {localResetTime}
              </div>
            </div>
          </div>

          {/* Daily XP Timer */}
          <div className="rounded-xl border border-[#37424D] bg-[#2E3944] p-4">
            <div className="text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-sm font-semibold tracking-wide text-white uppercase">
                  Daily XP Resets In
                </span>
              </div>
              <div className="mb-3 rounded-lg bg-[#2E3944] p-3">
                <span className="font-mono text-2xl font-bold text-white">
                  {formatTime(dailySecondsLeft)}
                </span>
              </div>
              <div className="text-xs text-[#D3D9D4]">
                Resets daily at {localDailyResetTime}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyContractsCountdown;
