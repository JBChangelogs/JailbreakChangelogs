import React from "react";
import Link from "next/link";

const TradingDescription: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <div className="mb-4">
        <h1 className="text-muted text-2xl font-semibold">
          Roblox Jailbreak Trading Hub
        </h1>
      </div>
      <p className="text-muted mb-4">
        Create trade advertisements for your Roblox Jailbreak items or browse
        existing trade ads from other players. Find the perfect trades and
        connect with the trading community.
      </p>
      <div className="mb-2 flex items-start gap-4 rounded-lg border border-[#5865F2]/40 bg-gradient-to-r from-[#232F3B] to-[#232F3B]/80 p-4 shadow-sm">
        <div className="relative z-10">
          <span className="text-base font-bold text-white">
            Discord Trade Ad Posting
          </span>
          <div className="text-muted mt-1">
            All trades are now automatically posted to our{" "}
            <a
              href="https://discord.jailbreakchangelogs.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-300 underline transition-colors hover:text-blue-400"
            >
              Discord
            </a>
            <span className="font-medium"> #trades</span> channel for more
            visibility.
            <br />
            <span className="font-medium">Supporters</span> have their trade ads
            stand out more in the Discord.{" "}
            <Link
              href="/supporting"
              className="underline transition-colors hover:text-blue-300"
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
