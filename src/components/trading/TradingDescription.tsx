import React from "react";
import Link from "next/link";

const TradingDescription: React.FC = () => {
  return (
    <div className="bg-secondary-bg border-border-primary mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <h1 className="text-secondary-text text-2xl font-semibold">
          Roblox Jailbreak Trading Hub
        </h1>
      </div>
      <p className="text-secondary-text mb-4">
        Create trade advertisements for your Roblox Jailbreak items or browse
        existing trade ads from other players. Find the perfect trades and
        connect with the trading community.
      </p>
      <div className="border-border-primary bg-button-info/10 mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm">
        <div className="relative z-10">
          <span className="text-primary-text text-base font-bold">
            Discord Trade Ad Posting
          </span>
          <div className="text-secondary-text mt-1">
            All trades are now automatically posted to our{" "}
            <a
              href="https://discord.jailbreakchangelogs.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-button-info hover:text-button-info-hover font-semibold underline transition-colors"
            >
              Discord #trades
            </a>{" "}
            channel for more visibility.
            <br />
            Supporters have their trade ads stand out more in the Discord.{" "}
            <Link
              href="/supporting"
              className="hover:text-button-info underline transition-colors"
            >
              Learn more
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDescription;
