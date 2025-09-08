"use client";

import React, { useEffect, useState } from 'react';

// Weekly contracts reset every Monday at 17:00 (assume UTC to be explicit)
// Adjust timezone if needed later.

const RESET_WEEKDAY = 1; // Monday (0 = Sunday, 1 = Monday ...)
const RESET_HOUR = 17; // 17:00
const RESET_MINUTE = 0;
const RESET_SECOND = 0;

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
      0
    )
  );

  // Day of week in UTC: 0 Sunday ... 6 Saturday
  const utcDay = next.getUTCDay();
  const daysUntilMonday = (RESET_WEEKDAY - utcDay + 7) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);

  // If we're already past this week's reset time, jump to next week
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }

  return Math.floor(next.getTime() / 1000);
}

function formatTime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  const dLabel = days === 1 ? 'day' : 'days';
  const hLabel = hours === 1 ? 'hour' : 'hours';
  const mLabel = minutes === 1 ? 'minute' : 'minutes';
  const sLabel = secs === 1 ? 'second' : 'seconds';
  return `${days} ${dLabel} ${hours} ${hLabel} ${minutes} ${mLabel} ${secs} ${sLabel}`;
}

const WeeklyContractsCountdown: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [nextResetUnix, setNextResetUnix] = useState<number>(() => getNextResetTimestamp(new Date()));

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
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextResetUnix]);

  const statusColor = '#A8B3BC';

  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold" style={{ color: statusColor }}>
            New Weekly contracts in
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-mono font-bold" style={{ color: statusColor }}>
            {formatTime(secondsLeft)}
          </span>
        </div>
        <div className="text-xs text-gray-300">
          Resets every Monday at 17:00 UTC.
        </div>
      </div>
    </div>
  );
};

export default WeeklyContractsCountdown;


