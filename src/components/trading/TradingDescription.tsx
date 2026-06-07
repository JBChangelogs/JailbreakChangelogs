import React from "react";
import NitroTradingVideoPlayer from "@/components/Ads/NitroTradingVideoPlayer";

const TradingDescription: React.FC = () => {
  return (
    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="mb-4">
            <h1 className="text-primary-text text-2xl font-semibold">
              Roblox Jailbreak Trading Hub
            </h1>
          </div>
          <p className="text-secondary-text mb-4">
            Create trade advertisements for your Roblox Jailbreak items or
            browse existing trade ads from other players. Find the perfect
            trades and connect with the trading community.
          </p>
        </div>

        <NitroTradingVideoPlayer className="w-full self-center lg:self-start" />
      </div>
    </div>
  );
};

export default TradingDescription;
