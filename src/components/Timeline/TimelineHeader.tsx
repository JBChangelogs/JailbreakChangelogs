"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Changelog } from "@/utils/api/api";
import UpdateStatisticsCard from "@/components/common/UpdateStatisticsCard";

interface TimelineHeaderProps {
  changelogs: Changelog[];
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ changelogs }) => {
  return (
    <div className="mb-6">
      <h2 className="page-heading mb-2">Roblox Jailbreak Timeline</h2>
      <p className="text-secondary-text mb-3">
        Explore the complete history of Roblox Jailbreak updates, from the
        game&apos;s launch to the latest changes. Track major updates, feature
        releases, and gameplay evolution chronologically.
      </p>

      <div className="mb-4">
        <UpdateStatisticsCard changelogs={changelogs} />
      </div>

      <Button asChild>
        <Link href="/changelogs">View Changelogs</Link>
      </Button>
    </div>
  );
};

export default TimelineHeader;
