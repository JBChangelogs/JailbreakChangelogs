import React from 'react';
import Link from 'next/link';
import { ClockIcon, CalendarIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface TimelineHeaderProps {
  onViewMore: () => void;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  onViewMore,
}) => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="mb-4 text-2xl font-semibold text-muted">
        Roblox Jailbreak Timeline
      </h2>
      <p className="mb-4 text-muted">
        Explore the complete history of Roblox Jailbreak updates, from the game&apos;s launch to the latest changes. Track major updates, feature releases, and gameplay evolution chronologically.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
          <div className="mb-3 flex items-center space-x-3">
            <ClockIcon className="h-6 w-6 text-[#5865F2]" />
            <div>
              <h3 className="font-semibold text-muted">Chronological History</h3>
            </div>
          </div>
          <p className="text-sm text-muted">
            Timeline entries are displayed from newest to oldest, starting with the latest update at the top.
          </p>
        </div>

        <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
          <div className="mb-3 flex items-center space-x-3">
            <CalendarIcon className="h-6 w-6 text-[#5865F2]" />
            <div>
              <h3 className="font-semibold text-muted">Major Updates</h3>
            </div>
          </div>
          <p className="text-sm text-muted">
            Major gameplay changes and additions that have shaped the game&apos;s evolution.
          </p>
        </div>

        <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
          <div className="mb-3 flex items-center space-x-3">
            <ArrowPathIcon className="h-6 w-6 text-[#5865F2]" />
            <div>
              <h3 className="font-semibold text-muted">Content Updates</h3>
            </div>
          </div>
          <p className="text-sm text-muted">
            Content updates and seasonal events that have kept the game fresh and engaging.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/changelogs"
          className="inline-flex items-center justify-center rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-3 text-muted hover:border-[#5865F2] transition-colors"
        >
          View Changelogs
        </Link>

        <button
          onClick={onViewMore}
          className="inline-flex items-center justify-center rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-3 text-muted hover:border-[#5865F2] transition-colors"
        >
          View More
        </button>
      </div>
    </div>
  );
};

export default TimelineHeader; 