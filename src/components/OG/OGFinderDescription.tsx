"use client";

import RelatedInventoryPages from "@/components/Inventory/RelatedInventoryPages";

const OGFinderDescription = () => {
  return (
    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="mb-2">
        <div className="flex items-center gap-3">
          <h2 className="page-heading">
            Jailbreak Changelogs OG Finder - Track Your Original Items
          </h2>
        </div>
      </div>
      <p className="text-secondary-text mb-3">
        Find items you originally owned in Roblox Jailbreak but have since
        traded away. Enter your Roblox ID or username to see who currently has
        your old items and track their journey through the trading community.
      </p>

      <RelatedInventoryPages current="og" />
    </div>
  );
};

export default OGFinderDescription;
