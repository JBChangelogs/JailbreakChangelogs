"use client";

import React, { useState, useEffect } from 'react';

interface XpImportantDatesProps {
  season: number;
  title: string;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  doubleXpStart: number; // Unix timestamp
  seasonEnds: number; // Unix timestamp
}

export default function XpImportantDates({ season, title, startDate, endDate, doubleXpStart, seasonEnds }: XpImportantDatesProps) {
  const [doubleXpTimeLeft, setDoubleXpTimeLeft] = useState<string>('');
  const [seasonEndTimeLeft, setSeasonEndTimeLeft] = useState<string>('');
  const [doubleXpStatus, setDoubleXpStatus] = useState<string>('');
  const [seasonEndStatus, setSeasonEndStatus] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);

      // Double XP countdown
      if (now < doubleXpStart) {
        const timeToDoubleXp = doubleXpStart - now;
        const daysLeft = Math.floor(timeToDoubleXp / (24 * 60 * 60));
        
        if (daysLeft <= 1) {
          setDoubleXpStatus('Double XP starts in (Less than 1 day!)');
        } else {
          setDoubleXpStatus('Double XP starts in');
        }
        setDoubleXpTimeLeft(formatTime(timeToDoubleXp));
      } else {
        setDoubleXpStatus('Double XP is now active!');
        setDoubleXpTimeLeft('');
      }

      // Season end countdown
      if (now < seasonEnds) {
        const timeToEnd = seasonEnds - now;
        const daysLeft = Math.floor(timeToEnd / (24 * 60 * 60));

        if (daysLeft < 5) {
          setSeasonEndStatus('Season ends in (Double XP Active!)');
        } else if (daysLeft <= 7) {
          setSeasonEndStatus('Season ends in (Final Week!)');
        } else {
          setSeasonEndStatus('Season ends in');
        }
        setSeasonEndTimeLeft(formatTime(timeToEnd));
      } else {
        setSeasonEndStatus('Season has ended');
        setSeasonEndTimeLeft('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [doubleXpStart, seasonEnds]);

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    const dLabel = days === 1 ? 'day' : 'days';
    const hLabel = hours === 1 ? 'hour' : 'hours';
    const mLabel = minutes === 1 ? 'minute' : 'minutes';
    const sLabel = secs === 1 ? 'second' : 'seconds';

    if (days > 0) {
      return `${days} ${dLabel} ${hours} ${hLabel} ${minutes} ${mLabel} ${secs} ${sLabel}`;
    } else if (hours > 0) {
      return `${hours} ${hLabel} ${minutes} ${mLabel} ${secs} ${sLabel}`;
    } else if (minutes > 0) {
      return `${minutes} ${mLabel} ${secs} ${sLabel}`;
    } else {
      return `${secs} ${sLabel}`;
    }
  };

  const getStatusColor = (status: string): string => {
    if (status.includes('Double XP')) return '#FFB636'; // Orange for Double XP
    if (status.includes('Final Week')) return '#FF6B6B'; // Red for final week
    if (status.includes('2 Weeks Left')) return '#FFD93D'; // Yellow for 2 weeks
    return '#A8B3BC'; // Default gray
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };



  return (
    <div>
      {/* Season Info Header */}
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-3xl font-bold text-[#FFFFFF]">
          Season {season} / {title}
        </h2>
        <div className="space-y-1 text-muted">
          <p className="text-lg">
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
          <p className="text-base">
            Duration: {Math.ceil((endDate - startDate) / (24 * 60 * 60))} days • Target Level 10
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Double XP Countdown - Only show when Double XP hasn't started yet */}
        {doubleXpStatus !== 'Double XP is now active!' && (
          <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <span 
                  className="text-lg font-semibold text-muted" 
                >
                  {doubleXpStatus}
                </span>
              </div>
              {doubleXpTimeLeft && (
                <div className="text-center">
                  <span 
                    className="text-3xl font-mono font-bold" 
                    style={{ color: getStatusColor(doubleXpStatus) }}
                  >
                    {doubleXpTimeLeft}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Season End Countdown */}
        <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <span 
                className="text-lg font-semibold text-muted" 
              >
                {seasonEndStatus}
              </span>
            </div>
            {seasonEndTimeLeft && (
              <div className="text-center">
                <span 
                  className="text-3xl font-mono font-bold" 
                  style={{ color: getStatusColor(seasonEndStatus) }}
                >
                  {seasonEndTimeLeft}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 