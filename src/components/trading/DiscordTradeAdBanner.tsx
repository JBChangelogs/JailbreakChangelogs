import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

interface DiscordTradeAdBannerProps {
  className?: string;
}

const DiscordTradeAdBanner: React.FC<DiscordTradeAdBannerProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`border-border-primary bg-button-info/10 flex items-start gap-4 rounded-lg border p-4 shadow-sm ${className}`}
    >
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
            className="text-primary-text hover:opacity-80 inline-flex items-center gap-1 font-semibold underline transition-opacity"
          >
            <Icon icon="akar-icons:link-out" className="h-4 w-4" />
            Discord #trades
          </a>{" "}
          channel for more visibility.
          <br />
          Supporters have their trade ads stand out more in the Discord.{" "}
          <Link
            href="/supporting"
            className="text-primary-text hover:opacity-80 font-semibold underline transition-opacity"
          >
            Learn more
          </Link>
          .
        </div>
      </div>
    </div>
  );
};

export default DiscordTradeAdBanner;
