import React from 'react';
import Link from 'next/link';

const TradingDescription: React.FC = () => {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-muted">
          Roblox Jailbreak Trading Hub
        </h1>
      </div>
      <p className="mb-4 text-muted">
        Create trade advertisements for your Roblox Jailbreak items or browse existing trade ads from other players. Find the perfect trades and connect with the trading community.
      </p>
      <div className="mb-2 p-4 rounded-lg bg-gradient-to-r from-[#232F3B] to-[#232F3B]/80 border border-[#5865F2]/40 flex items-start gap-4 shadow-sm">
        <div className="relative z-10">
          <span className="font-bold text-white text-base">Supporter 2+ Perk</span>
          <div className="text-muted mt-1">
            Your trades are automatically posted to our{' '}
            <a
              href="https://discord.jailbreakchangelogs.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 underline font-semibold hover:text-blue-400 transition-colors"
            >
              Discord
            </a>
            <span className="font-medium"> #trades</span> channel for more visibility.{' '}
            <Link href="/supporting" className="underline hover:text-blue-300 transition-colors">Learn more</Link>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDescription; 