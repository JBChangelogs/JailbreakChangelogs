"use client";

import React from "react";
import { Changelog } from "@/utils/api";
import UpdateStatisticsCard from "@/components/common/UpdateStatisticsCard";
import NitroChangelogVideoPlayer from "@/components/Ads/NitroChangelogVideoPlayer";

interface ChangelogHeaderProps {
  changelogs?: Changelog[];
}

const ChangelogHeader: React.FC<ChangelogHeaderProps> = ({ changelogs }) => {
  return (
    <div className="border-border-primary bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <h2 className="text-primary-text text-2xl font-semibold">
          Roblox Jailbreak Changelogs & Update History
        </h2>
      </div>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-4">
          <p className="text-secondary-text">
            Welcome to our comprehensive collection of Roblox Jailbreak
            changelogs! Track every update, feature release, and game
            modification in Jailbreak&apos;s history. Some updates and features
            may be unaccounted for, as they may not have been directly announced
            by Badimo.
          </p>

          <UpdateStatisticsCard changelogs={changelogs} />
        </div>

        <NitroChangelogVideoPlayer className="min-h-[210px] w-full max-w-xs self-center sm:max-w-sm lg:self-start" />
      </div>
    </div>
  );
};

export default ChangelogHeader;
