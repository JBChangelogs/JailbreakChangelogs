"use client";

import RelatedInventoryPages from "@/components/Inventory/RelatedInventoryPages";

const OGFinderDescription = () => {
  return (
    <div className="mb-6">
      <div className="mb-2">
        <div className="flex items-center gap-3">
          <h2 className="page-heading">OG Finder</h2>
        </div>
      </div>
      <p className="text-secondary-text mb-3">
        Enter a username or Roblox ID to find their original Jailbreak items and
        see who owns them now.
      </p>

      <RelatedInventoryPages current="og" />
    </div>
  );
};

export default OGFinderDescription;
