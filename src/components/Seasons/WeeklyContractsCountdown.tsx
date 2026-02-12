"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function formatTime(seconds: number): TimeLeft {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  return { days, hours, minutes, seconds: secs };
}

function pluralize(value: number, singular: string, plural: string): string {
  return value === 1 ? singular : plural;
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

  const localResetTime = (() => {
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
  })();

  const localDailyResetTime = (() => {
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
  })();

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
    <div className="border-border-card bg-secondary-bg relative overflow-hidden rounded-2xl border p-6">
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-primary-text mb-2 text-3xl font-bold tracking-wide">
            WEEKLY CONTRACTS
          </h2>
          {season && (
            <div className="mb-2">
              <span className="text-primary-text text-lg font-semibold">
                Season {season.season} / {season.title}
              </span>
            </div>
          )}
          <p className="text-secondary-text mb-4 text-sm leading-relaxed">
            View the current weekly contracts available in Roblox Jailbreak.
            Check what contracts you need to complete to earn XP and progress
            through this season.
          </p>

          {/* View Rewards Button */}
          <div className="flex justify-center">
            <Button asChild size="sm">
              <Link href={`/seasons/${season?.season}`}>
                View Season Rewards
              </Link>
            </Button>
          </div>
        </div>

        {/* Timer Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Weekly Contracts Timer */}
          <div className="border-border-card bg-tertiary-bg rounded-xl border p-4">
            <div className="text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-primary-text text-sm font-semibold tracking-wide uppercase">
                  New Contracts In
                </span>
              </div>
              <div className="mb-3 flex justify-center gap-4 rounded-lg p-3">
                {(() => {
                  const time = formatTime(secondsLeft);
                  return (
                    <>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.days } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.days} days`}
                          >
                            {time.days}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.days, "day", "days")}
                        </span>
                      </div>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.hours } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.hours} hours`}
                          >
                            {time.hours}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.hours, "hour", "hours")}
                        </span>
                      </div>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.minutes } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.minutes} minutes`}
                          >
                            {time.minutes}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.minutes, "min", "mins")}
                        </span>
                      </div>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.seconds } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.seconds} seconds`}
                          >
                            {time.seconds}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.seconds, "sec", "secs")}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="text-secondary-text text-xs">
                Resets every Monday at {localResetTime}
              </div>
            </div>
          </div>

          {/* Daily XP Timer */}
          <div className="border-border-card bg-tertiary-bg rounded-xl border p-4">
            <div className="text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-primary-text text-sm font-semibold tracking-wide uppercase">
                  Daily XP Resets In
                </span>
              </div>
              <div className="mb-3 flex justify-center gap-4 rounded-lg p-3">
                {(() => {
                  const time = formatTime(dailySecondsLeft);
                  return (
                    <>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.days } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.days} days`}
                          >
                            {time.days}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.days, "day", "days")}
                        </span>
                      </div>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.hours } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.hours} hours`}
                          >
                            {time.hours}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.hours, "hour", "hours")}
                        </span>
                      </div>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.minutes } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.minutes} minutes`}
                          >
                            {time.minutes}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.minutes, "min", "mins")}
                        </span>
                      </div>
                      <div>
                        <span className="countdown text-primary-text text-4xl font-semibold">
                          <span
                            style={
                              { "--value": time.seconds } as React.CSSProperties
                            }
                            aria-live="polite"
                            aria-label={`${time.seconds} seconds`}
                          >
                            {time.seconds}
                          </span>
                        </span>
                        <span className="text-primary-text ml-1">
                          {pluralize(time.seconds, "sec", "secs")}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="text-secondary-text text-xs">
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
