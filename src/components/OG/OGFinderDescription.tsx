import React from "react";

const OGFinderDescription: React.FC = () => {
  return (
    <div className="bg-secondary-bg border-border-primary mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-primary-text text-2xl font-semibold">
            Jailbreak Changelogs OG Finder - Track Your Original Items
          </h2>
          <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
            New
          </span>
        </div>
      </div>
      <p className="text-secondary-text mb-4">
        Find items you originally owned in Roblox Jailbreak but have since
        traded away. Enter your Roblox ID or username to see who currently has
        your old items and track their journey through the trading community.
      </p>
    </div>
  );
};

export default OGFinderDescription;
