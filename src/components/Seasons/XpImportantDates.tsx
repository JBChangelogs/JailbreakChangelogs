"use client";

import React, { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface XpImportantDatesProps {
  season: number;
  title: string;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  doubleXpStart: number; // Unix timestamp
  seasonEnds: number; // Unix timestamp
}

export default function XpImportantDates({
  season,
  title,
  startDate,
  endDate,
  doubleXpStart,
  seasonEnds,
}: XpImportantDatesProps) {
  const [doubleXpTimeLeft, setDoubleXpTimeLeft] = useState<TimeLeft | null>(
    null,
  );
  const [seasonEndTimeLeft, setSeasonEndTimeLeft] = useState<TimeLeft | null>(
    null,
  );
  const [doubleXpStatus, setDoubleXpStatus] = useState<string>("");
  const [seasonEndStatus, setSeasonEndStatus] = useState<string>("");

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

      // Double XP countdown
      if (now < doubleXpStart) {
        const timeToDoubleXp = doubleXpStart - now;
        const daysLeft = Math.floor(timeToDoubleXp / (24 * 60 * 60));

        if (daysLeft <= 1) {
          setDoubleXpStatus("Double XP starts in (Less than 1 day!)");
        } else {
          setDoubleXpStatus("Double XP starts in");
        }
        setDoubleXpTimeLeft(formatTime(timeToDoubleXp));
      } else {
        setDoubleXpStatus("Double XP is now active!");
        setDoubleXpTimeLeft(null);
      }

      // Season end countdown
      if (now < seasonEnds) {
        const timeToEnd = seasonEnds - now;
        const daysLeft = Math.floor(timeToEnd / (24 * 60 * 60));

        if (daysLeft < 5) {
          setSeasonEndStatus("Season ends in (Double XP Active!)");
        } else if (daysLeft <= 7) {
          setSeasonEndStatus("Season ends in (Final Week!)");
        } else {
          setSeasonEndStatus("Season ends in");
        }
        setSeasonEndTimeLeft(formatTime(timeToEnd));
      } else {
        setSeasonEndStatus("Season has ended");
        setSeasonEndTimeLeft(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [doubleXpStart, seasonEnds]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Season Info Header */}
      <div className="mb-6 text-center">
        <h2 className="text-secondary-text mb-2 text-3xl font-bold">
          Season {season} / {title}
        </h2>
        <div className="text-secondary-text space-y-1">
          <p className="text-lg">
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
          <p className="text-base">
            Duration: {Math.ceil((endDate - startDate) / (24 * 60 * 60))} days •
            Target: Level 10
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Double XP Countdown - Only show when Double XP hasn't started yet */}
        {doubleXpStatus !== "Double XP is now active!" && (
          <div className="border-border-primary hover:border-border-focus bg-primary-bg rounded-lg border p-4">
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <span className="text-primary-text text-lg font-semibold">
                  {doubleXpStatus}
                </span>
              </div>
              {doubleXpTimeLeft && (
                <div className="flex justify-center gap-4">
                  <div>
                    <span className="countdown text-primary-text text-4xl font-semibold">
                      <span
                        style={
                          {
                            "--value": doubleXpTimeLeft.days,
                          } as React.CSSProperties
                        }
                        aria-live="polite"
                        aria-label={`${doubleXpTimeLeft.days} days`}
                      >
                        {doubleXpTimeLeft.days}
                      </span>
                    </span>
                    <span className="text-primary-text ml-1">
                      {pluralize(doubleXpTimeLeft.days, "day", "days")}
                    </span>
                  </div>
                  <div>
                    <span className="countdown text-primary-text text-4xl font-semibold">
                      <span
                        style={
                          {
                            "--value": doubleXpTimeLeft.hours,
                          } as React.CSSProperties
                        }
                        aria-live="polite"
                        aria-label={`${doubleXpTimeLeft.hours} hours`}
                      >
                        {doubleXpTimeLeft.hours}
                      </span>
                    </span>
                    <span className="text-primary-text ml-1">
                      {pluralize(doubleXpTimeLeft.hours, "hour", "hours")}
                    </span>
                  </div>
                  <div>
                    <span className="countdown text-primary-text text-4xl font-semibold">
                      <span
                        style={
                          {
                            "--value": doubleXpTimeLeft.minutes,
                          } as React.CSSProperties
                        }
                        aria-live="polite"
                        aria-label={`${doubleXpTimeLeft.minutes} minutes`}
                      >
                        {doubleXpTimeLeft.minutes}
                      </span>
                    </span>
                    <span className="text-primary-text ml-1">
                      {pluralize(doubleXpTimeLeft.minutes, "min", "mins")}
                    </span>
                  </div>
                  <div>
                    <span className="countdown text-primary-text text-4xl font-semibold">
                      <span
                        style={
                          {
                            "--value": doubleXpTimeLeft.seconds,
                          } as React.CSSProperties
                        }
                        aria-live="polite"
                        aria-label={`${doubleXpTimeLeft.seconds} seconds`}
                      >
                        {doubleXpTimeLeft.seconds}
                      </span>
                    </span>
                    <span className="text-primary-text ml-1">
                      {pluralize(doubleXpTimeLeft.seconds, "sec", "secs")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Season End Countdown */}
        <div className="border-border-primary hover:border-border-focus bg-primary-bg rounded-lg border p-4">
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <span className="text-primary-text text-lg font-semibold">
                {seasonEndStatus}
              </span>
            </div>
            {seasonEndTimeLeft && (
              <div className="flex justify-center gap-4">
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": seasonEndTimeLeft.days,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${seasonEndTimeLeft.days} days`}
                    >
                      {seasonEndTimeLeft.days}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(seasonEndTimeLeft.days, "day", "days")}
                  </span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": seasonEndTimeLeft.hours,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${seasonEndTimeLeft.hours} hours`}
                    >
                      {seasonEndTimeLeft.hours}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(seasonEndTimeLeft.hours, "hour", "hours")}
                  </span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": seasonEndTimeLeft.minutes,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${seasonEndTimeLeft.minutes} minutes`}
                    >
                      {seasonEndTimeLeft.minutes}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(seasonEndTimeLeft.minutes, "min", "mins")}
                  </span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-4xl font-semibold">
                    <span
                      style={
                        {
                          "--value": seasonEndTimeLeft.seconds,
                        } as React.CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${seasonEndTimeLeft.seconds} seconds`}
                    >
                      {seasonEndTimeLeft.seconds}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">
                    {pluralize(seasonEndTimeLeft.seconds, "sec", "secs")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
