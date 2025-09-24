import React from "react";

interface ExperimentalFeatureBannerProps {
  className?: string;
}

export default function ExperimentalFeatureBanner({
  className = "",
}: ExperimentalFeatureBannerProps) {
  return (
    <div
      className={`border-border-primary bg-button-info/10 mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm ${className}`}
    >
      <div className="relative z-10">
        <span className="text-primary-text text-base font-bold">
          Experimental Feature
        </span>
        <div className="text-secondary-text mt-1">
          This feature is experimental; information may be inaccurate or the
          feature may break.
          <br />
          Help us improve it by reporting any issues you find.{" "}
          <a
            href="https://discord.jailbreakchangelogs.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-button-info hover:text-button-info-hover font-semibold underline transition-colors"
          >
            Join our Discord
          </a>
          .
        </div>
      </div>
    </div>
  );
}
