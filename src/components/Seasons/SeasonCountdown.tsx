"use client";

import React, { useState, useEffect } from "react";
import { trackEvent } from "@/utils/analytics/rybbit";
import { Button } from "@/components/ui/button";
import NumberFlow from "@number-flow/react";

interface Reward {
  id: number;
  season_number: number;
  item: string;
  requirement: string;
  link: string;
  exclusive: string;
  bonus: string;
}

interface Season {
  season: number;
  title: string;
  start_date: number;
  end_date: number;
  description: string;
  rewards: Reward[];
}

interface SeasonCountdownProps {
  currentSeason: Season | null;
  nextSeason: Season | null;
  /** Season being viewed; its name is dropped from labels since the page title shows it */
  viewedSeason?: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const SeasonCountdown: React.FC<SeasonCountdownProps> = ({
  currentSeason,
  nextSeason,
  viewedSeason,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [status, setStatus] = useState<string>("");
  const [doubleXp, setDoubleXp] = useState(false);
  const [nextSeasonTimeLeft, setNextSeasonTimeLeft] = useState<TimeLeft | null>(
    null,
  );
  const [nextSeasonStatus, setNextSeasonStatus] = useState<string>("");

  const formatTime = (seconds: number): TimeLeft => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    return { days, hours, minutes, seconds: secs };
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);

      const name =
        currentSeason && currentSeason.season !== viewedSeason
          ? `Season ${currentSeason.season} / ${currentSeason.title}`
          : null;
      const label = (verb: string) =>
        name ? `${name} ${verb}` : verb[0].toUpperCase() + verb.slice(1);

      // Handle current season
      if (!currentSeason) {
        setTimeLeft(null);
        setDoubleXp(false);
      } else if (currentSeason.start_date && now < currentSeason.start_date) {
        const timeToStart = currentSeason.start_date - now;
        setStatus(label("starts in"));
        setTimeLeft(formatTime(timeToStart));
      } else if (
        currentSeason.start_date &&
        currentSeason.end_date &&
        now < currentSeason.end_date
      ) {
        const timeToEnd = currentSeason.end_date - now;
        // Badimo runs Double XP for the last 5 days of a season
        setDoubleXp(timeToEnd < 5 * 24 * 60 * 60);
        setStatus(label("ends in"));

        setTimeLeft(formatTime(timeToEnd));
      } else if (currentSeason.end_date && now >= currentSeason.end_date) {
        setTimeLeft(null);
      }

      // Handle next season
      if (nextSeason) {
        if (
          nextSeason.end_date &&
          (!nextSeason.start_date || nextSeason.start_date === 0) &&
          now < nextSeason.end_date
        ) {
          const timeToEnd = nextSeason.end_date - now;

          setNextSeasonStatus(
            `Season ${nextSeason.season} submissions close in`,
          );
          setNextSeasonTimeLeft(formatTime(timeToEnd));
        } else if (
          nextSeason.start_date &&
          (!nextSeason.end_date || nextSeason.end_date === 0) &&
          now < nextSeason.start_date
        ) {
          const timeToStart = nextSeason.start_date - now;

          setNextSeasonStatus(`Season ${nextSeason.season} starts in`);
          setNextSeasonTimeLeft(formatTime(timeToStart));
        } else if (
          (nextSeason.end_date && now >= nextSeason.end_date) ||
          nextSeason.start_date
        ) {
          setNextSeasonStatus(
            `Season ${nextSeason.season} submissions are closed`,
          );
          setNextSeasonTimeLeft(null);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentSeason, nextSeason, viewedSeason]);

  if (!timeLeft && !nextSeasonStatus) return null;

  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
      {timeLeft && (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-secondary-text text-sm font-medium">
              {status}
            </span>
            {doubleXp && (
              <span className="bg-status-success text-button-success-text inline-flex h-5 items-center rounded-md px-2 text-xs leading-none font-bold">
                2× XP Active
              </span>
            )}
          </div>
          <TimeBlocks time={timeLeft} />
        </div>
      )}

      {nextSeasonStatus && (
        <div
          className={
            timeLeft ? "border-border-card mt-4 border-t pt-4" : undefined
          }
        >
          <div className="flex items-center">
            <span className="text-secondary-text text-sm font-medium">
              {nextSeasonStatus}
            </span>
          </div>
          {nextSeasonTimeLeft && <TimeBlocks time={nextSeasonTimeLeft} />}
          {nextSeasonStatus.includes("submissions") && (
            <Button asChild size="sm" className="mt-3 w-full sm:w-auto">
              <a
                href={process.env.NEXT_PUBLIC_SUBMISSIONS_URL || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  const buttonType = nextSeasonStatus.includes("close in")
                    ? "Submit a Creation"
                    : "View Submissions";
                  trackEvent("Season Submission Click", {
                    buttonType,
                    season: nextSeason?.season || "unknown",
                  });
                }}
              >
                {nextSeasonStatus.includes("close in")
                  ? "Submit a Creation"
                  : "View Submissions"}
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

function TimeBlocks({ time }: { time: TimeLeft }) {
  // tensMax caps the tens digit so 00 -> 59 rolls 0 -> 5, not through 9..6
  const units = [
    [time.days, "day", "days", undefined],
    [time.hours, "hour", "hours", 2],
    [time.minutes, "min", "mins", 5],
    [time.seconds, "sec", "secs", 5],
  ] as const;
  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {units.map(([value, one, many, tensMax]) => (
        <div
          key={one}
          className="bg-tertiary-bg flex flex-col items-center rounded-md py-2"
        >
          <NumberFlow
            translate="no"
            value={value}
            trend={-1}
            digits={tensMax ? { 1: { max: tensMax } } : undefined}
            format={{ minimumIntegerDigits: 2, useGrouping: false }}
            className="text-primary-text text-2xl font-bold"
          />
          <span className="text-secondary-text text-xs">
            {value === 1 ? one : many}
          </span>
        </div>
      ))}
    </div>
  );
}

export default SeasonCountdown;
