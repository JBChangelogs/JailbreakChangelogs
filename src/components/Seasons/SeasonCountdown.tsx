"use client";

import React, { useState, useEffect } from "react";

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
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [status, setStatus] = useState<string>("");
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

  const pluralize = (
    value: number,
    singular: string,
    plural: string,
  ): string => {
    return value === 1 ? singular : plural;
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);

      // Handle current season
      if (!currentSeason) {
        setStatus("No Season Data");
        setTimeLeft(null);
      } else if (currentSeason.start_date && now < currentSeason.start_date) {
        const timeToStart = currentSeason.start_date - now;
        setStatus(
          `Season ${currentSeason.season} / ${currentSeason.title} starts in`,
        );
        setTimeLeft(formatTime(timeToStart));
      } else if (
        currentSeason.start_date &&
        currentSeason.end_date &&
        now < currentSeason.end_date
      ) {
        const timeToEnd = currentSeason.end_date - now;
        const daysLeft = Math.floor(timeToEnd / (24 * 60 * 60));

        if (daysLeft < 5) {
          setStatus(
            `Season ${currentSeason.season} / ${currentSeason.title} ends in (Double XP Active!)`,
          );
        } else {
          setStatus(
            `Season ${currentSeason.season} / ${currentSeason.title} ends in`,
          );
        }

        setTimeLeft(formatTime(timeToEnd));
      } else if (currentSeason.end_date && now >= currentSeason.end_date) {
        setStatus(
          `Season ${currentSeason.season} / ${currentSeason.title} has ended`,
        );
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
            `Submissions for Season ${nextSeason.season} / ${nextSeason.title} close in`,
          );
          setNextSeasonTimeLeft(formatTime(timeToEnd));
        } else if (
          nextSeason.start_date &&
          (!nextSeason.end_date || nextSeason.end_date === 0) &&
          now < nextSeason.start_date
        ) {
          const timeToStart = nextSeason.start_date - now;

          setNextSeasonStatus(
            `Season ${nextSeason.season} / ${nextSeason.title} starts in`,
          );
          setNextSeasonTimeLeft(formatTime(timeToStart));
        } else if (
          (nextSeason.end_date && now >= nextSeason.end_date) ||
          nextSeason.start_date
        ) {
          setNextSeasonStatus(
            `Submissions for Season ${nextSeason.season} / ${nextSeason.title} are closed`,
          );
          setNextSeasonTimeLeft(null);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentSeason, nextSeason]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border-primary bg-primary-bg hover:border-border-focus rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary-text text-lg font-semibold">
              {status}
            </span>
          </div>
          {timeLeft && (
            <div className="flex gap-4">
              <div>
                <span className="countdown text-primary-text text-4xl font-semibold">
                  <span
                    style={{ "--value": timeLeft.days } as React.CSSProperties}
                    aria-live="polite"
                    aria-label={`${timeLeft.days} days`}
                  >
                    {timeLeft.days}
                  </span>
                </span>
                <span className="text-primary-text ml-1">
                  {pluralize(timeLeft.days, "day", "days")}
                </span>
              </div>
              <div>
                <span className="countdown text-primary-text text-4xl font-semibold">
                  <span
                    style={{ "--value": timeLeft.hours } as React.CSSProperties}
                    aria-live="polite"
                    aria-label={`${timeLeft.hours} hours`}
                  >
                    {timeLeft.hours}
                  </span>
                </span>
                <span className="text-primary-text ml-1">
                  {pluralize(timeLeft.hours, "hour", "hours")}
                </span>
              </div>
              <div>
                <span className="countdown text-primary-text text-4xl font-semibold">
                  <span
                    style={
                      { "--value": timeLeft.minutes } as React.CSSProperties
                    }
                    aria-live="polite"
                    aria-label={`${timeLeft.minutes} minutes`}
                  >
                    {timeLeft.minutes}
                  </span>
                </span>
                <span className="text-primary-text ml-1">
                  {pluralize(timeLeft.minutes, "min", "mins")}
                </span>
              </div>
              <div>
                <span className="countdown text-primary-text text-4xl font-semibold">
                  <span
                    style={
                      { "--value": timeLeft.seconds } as React.CSSProperties
                    }
                    aria-live="polite"
                    aria-label={`${timeLeft.seconds} seconds`}
                  >
                    {timeLeft.seconds}
                  </span>
                </span>
                <span className="text-primary-text ml-1">
                  {pluralize(timeLeft.seconds, "sec", "secs")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {nextSeasonStatus && (
        <div className="border-border-primary bg-primary-bg hover:border-border-focus rounded-lg border p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-primary-text text-lg font-semibold">
                {nextSeasonStatus}
              </span>
            </div>
            {nextSeasonTimeLeft && (
              <div className="flex gap-4">
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": nextSeasonTimeLeft.days,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${nextSeasonTimeLeft.days} days`}
                    >
                      {nextSeasonTimeLeft.days}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(nextSeasonTimeLeft.days, "day", "days")}
                  </span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": nextSeasonTimeLeft.hours,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${nextSeasonTimeLeft.hours} hours`}
                    >
                      {nextSeasonTimeLeft.hours}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(nextSeasonTimeLeft.hours, "hour", "hours")}
                  </span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": nextSeasonTimeLeft.minutes,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${nextSeasonTimeLeft.minutes} minutes`}
                    >
                      {nextSeasonTimeLeft.minutes}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(nextSeasonTimeLeft.minutes, "min", "mins")}
                  </span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": nextSeasonTimeLeft.seconds,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${nextSeasonTimeLeft.seconds} seconds`}
                    >
                      {nextSeasonTimeLeft.seconds}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(nextSeasonTimeLeft.seconds, "sec", "secs")}
                  </span>
                </div>
              </div>
            )}
            {nextSeasonStatus.includes("Submissions") && (
              <div className="mt-2">
                <a
                  href={process.env.NEXT_PUBLIC_SUBMISSIONS_URL || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-block rounded-lg px-4 py-2 transition-colors"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.umami) {
                      const buttonType = nextSeasonStatus.includes("close in")
                        ? "Submit a Creation"
                        : "View Submissions";
                      window.umami.track("Season Submission Click", {
                        buttonType,
                        season: nextSeason?.season || "unknown",
                      });
                    }
                  }}
                >
                  {nextSeasonStatus.includes("close in")
                    ? "Submit a Creation"
                    : "View Submissions"}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonCountdown;
