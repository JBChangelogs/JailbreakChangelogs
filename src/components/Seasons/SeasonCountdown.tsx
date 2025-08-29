"use client";

import React, { useState, useEffect } from 'react';

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

const SeasonCountdown: React.FC<SeasonCountdownProps> = ({ currentSeason, nextSeason }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [statusColor, setStatusColor] = useState<string>('');
  const [nextSeasonTimeLeft, setNextSeasonTimeLeft] = useState<string>('');
  const [nextSeasonStatus, setNextSeasonStatus] = useState<string>('');
  const [nextSeasonStatusColor, setNextSeasonStatusColor] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);

      // Handle current season
      if (!currentSeason) {
        setStatus('No Season Data');
        setStatusColor('#A8B3BC');
        setTimeLeft('00:00:00:00');
      } else if (currentSeason.start_date && now < currentSeason.start_date) {
        const timeToStart = currentSeason.start_date - now;
        setStatus(`Season ${currentSeason.season} / ${currentSeason.title} starts in`);
        setStatusColor('#4CAF50');
        setTimeLeft(formatTime(timeToStart));
      } else if (currentSeason.start_date && currentSeason.end_date && now < currentSeason.end_date) {
        const timeToEnd = currentSeason.end_date - now;
        const daysLeft = Math.floor(timeToEnd / (24 * 60 * 60));

        if (daysLeft < 5) {
          setStatusColor('#FFB636');
          setStatus(`Season ${currentSeason.season} / ${currentSeason.title} ends in (Double XP Active!)`);
        } else if (daysLeft <= 7) {
          setStatusColor('#FF6B6B');
          setStatus(`Season ${currentSeason.season} / ${currentSeason.title} ends in`);
        } else if (daysLeft <= 14) {
          setStatusColor('#FFD93D');
          setStatus(`Season ${currentSeason.season} / ${currentSeason.title} ends in`);
        } else {
          setStatusColor('#A8B3BC');
          setStatus(`Season ${currentSeason.season} / ${currentSeason.title} ends in`);
        }

        setTimeLeft(formatTime(timeToEnd));
      } else if (currentSeason.end_date && now >= currentSeason.end_date) {
        setStatus(`Season ${currentSeason.season} / ${currentSeason.title} has ended`);
        setStatusColor('#A8B3BC');
        setTimeLeft('');
      }

      // Handle next season
      if (nextSeason) {
        if (nextSeason.end_date && (!nextSeason.start_date || nextSeason.start_date === 0) && now < nextSeason.end_date) {
          const timeToEnd = nextSeason.end_date - now;
          const daysLeft = Math.floor(timeToEnd / (24 * 60 * 60));

          if (daysLeft > 14) {
            setNextSeasonStatusColor('#4CAF50'); // Green for more than 2 weeks
          } else if (daysLeft > 7) {
            setNextSeasonStatusColor('#FFD93D'); // Yellow for 8-14 days
          } else if (daysLeft > 3) {
            setNextSeasonStatusColor('#FFB636'); // Orange for 4-7 days
          } else {
            setNextSeasonStatusColor('#FF6B6B'); // Red for last 3 days
          }

          setNextSeasonStatus(`Submissions for Season ${nextSeason.season} / ${nextSeason.title} close in`);
          setNextSeasonTimeLeft(formatTime(timeToEnd));
        } else if (nextSeason.start_date && (!nextSeason.end_date || nextSeason.end_date === 0) && now < nextSeason.start_date) {
          const timeToStart = nextSeason.start_date - now;

          // Always use green for season start countdown
          setNextSeasonStatusColor('#4CAF50');

          setNextSeasonStatus(`Season ${nextSeason.season} / ${nextSeason.title} starts in`);
          setNextSeasonTimeLeft(formatTime(timeToStart));
        } else if ((nextSeason.end_date && now >= nextSeason.end_date) || nextSeason.start_date) {
          setNextSeasonStatus(`Submissions for Season ${nextSeason.season} / ${nextSeason.title} are closed`);
          setNextSeasonStatusColor('#A8B3BC');
          setNextSeasonTimeLeft('');
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentSeason, nextSeason]);

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    return `${days} days ${hours} hours ${minutes} minutes ${secs} seconds`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold" style={{ color: statusColor }}>
              {status}
            </span>
          </div>
          {timeLeft && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold" style={{ color: statusColor }}>
                {timeLeft}
              </span>
            </div>
          )}
        </div>
      </div>

      {nextSeasonStatus && (
        <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold" style={{ color: nextSeasonStatusColor }}>
                {nextSeasonStatus}
              </span>
            </div>
            {nextSeasonTimeLeft && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold" style={{ color: nextSeasonStatusColor }}>
                  {nextSeasonTimeLeft}
                </span>
              </div>
            )}
            {(nextSeasonStatus.includes('Submissions')) && (
              <div className="mt-2">
                <a
                  href="https://www.reddit.com/r/JailbreakCreations/comments/1mf3t32/season_28_entries_cyberpunk/?sort=new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors inline-block"
                >
                  {nextSeasonStatus.includes('close in') ? 'Submit a Creation' : 'View Submissions'}
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