import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TimelineHeader: React.FC = () => {
  return (
    <div className="bg-secondary-bg border-border-primary mb-8 rounded-lg border p-6">
      <h2 className="text-secondary-text mb-4 text-2xl font-semibold">
        Roblox Jailbreak Timeline
      </h2>
      <p className="text-secondary-text mb-4">
        Explore the complete history of Roblox Jailbreak updates, from the
        game&apos;s launch to the latest changes. Track major updates, feature
        releases, and gameplay evolution chronologically.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild>
          <Link href="/changelogs">View Changelogs</Link>
        </Button>
      </div>
    </div>
  );
};

export default TimelineHeader;
