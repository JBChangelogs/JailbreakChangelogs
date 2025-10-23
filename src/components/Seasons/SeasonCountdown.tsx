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

const SeasonCountdown: React.FC<SeasonCountdownProps> = ({
  currentSeason,
  nextSeason,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusColor, setStatusColor] = useState<string>("");
  const [nextSeasonTimeLeft, setNextSeasonTimeLeft] = useState<string>("");
  const [nextSeasonStatus, setNextSeasonStatus] = useState<string>("");
  const [nextSeasonStatusColor, setNextSeasonStatusColor] =
    useState<string>("");

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    const dLabel = days === 1 ? "day" : "days";
    const hLabel = hours === 1 ? "hour" : "hours";
    const mLabel = minutes === 1 ? "minute" : "minutes";
    const sLabel = secs === 1 ? "second" : "seconds";

    return `${days} ${dLabel} ${hours} ${hLabel} ${minutes} ${mLabel} ${secs} ${sLabel}`;
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);

      // Handle current season
      if (!currentSeason) {
        setStatus("No Season Data");
        setStatusColor("var(--color-secondary-text)");
        setTimeLeft("00:00:00:00");
      } else if (currentSeason.start_date && now < currentSeason.start_date) {
        const timeToStart = currentSeason.start_date - now;
        setStatus(
          `Season ${currentSeason.season} / ${currentSeason.title} starts in`,
        );
        setStatusColor("var(--color-button-success)");
        setTimeLeft(formatTime(timeToStart));
      } else if (
        currentSeason.start_date &&
        currentSeason.end_date &&
        now < currentSeason.end_date
      ) {
        const timeToEnd = currentSeason.end_date - now;
        const daysLeft = Math.floor(timeToEnd / (24 * 60 * 60));

        if (daysLeft < 5) {
          setStatusColor("var(--color-secondary-text)");
          setStatus(
            `Season ${currentSeason.season} / ${currentSeason.title} ends in (Double XP Active!)`,
          );
        } else {
          setStatusColor("var(--color-secondary-text)");
          setStatus(
            `Season ${currentSeason.season} / ${currentSeason.title} ends in`,
          );
        }

        setTimeLeft(formatTime(timeToEnd));
      } else if (currentSeason.end_date && now >= currentSeason.end_date) {
        setStatus(
          `Season ${currentSeason.season} / ${currentSeason.title} has ended`,
        );
        setStatusColor("var(--color-secondary-text)");
        setTimeLeft("");
      }

      // Handle next season
      if (nextSeason) {
        if (
          nextSeason.end_date &&
          (!nextSeason.start_date || nextSeason.start_date === 0) &&
          now < nextSeason.end_date
        ) {
          const timeToEnd = nextSeason.end_date - now;

          setNextSeasonStatusColor("var(--color-secondary-text)");

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

          // Use consistent color for season start countdown
          setNextSeasonStatusColor("var(--color-secondary-text)");

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
          setNextSeasonStatusColor("var(--color-secondary-text)");
          setNextSeasonTimeLeft("");
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentSeason, nextSeason]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border-primary hover:border-border-focus bg-primary-bg rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-semibold"
              style={{ color: statusColor }}
            >
              {status}
            </span>
          </div>
          {timeLeft && (
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: statusColor }}
              >
                {timeLeft}
              </span>
            </div>
          )}
        </div>
      </div>

      {nextSeasonStatus && (
        <div className="border-border-primary hover:border-border-focus bg-primary-bg rounded-lg border p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-semibold"
                style={{ color: nextSeasonStatusColor }}
              >
                {nextSeasonStatus}
              </span>
            </div>
            {nextSeasonTimeLeft && (
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold"
                  style={{ color: nextSeasonStatusColor }}
                >
                  {nextSeasonTimeLeft}
                </span>
              </div>
            )}
            {nextSeasonStatus.includes("Submissions") && (
              <div className="mt-2">
                <a
                  href="https://www.reddit.com/r/JailbreakCreations/comments/1npjm5s/season_29_entries_ogroblox/?sort=new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-block rounded-lg px-4 py-2 transition-colors"
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
