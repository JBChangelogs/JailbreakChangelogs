"use client";

import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";

interface UserTypeTabsProps {
  userType: "discord" | "roblox";
  onUserTypeChange: (type: "discord" | "roblox") => void;
}

export default function UserTypeTabs({
  userType,
  onUserTypeChange,
}: UserTypeTabsProps) {
  return (
    <div className="inline-flex">
      {(["discord", "roblox"] as const).map((type) => (
        <button
          key={type}
          onClick={() => onUserTypeChange(type)}
          className={[
            "flex items-center gap-1 px-3 py-1.5 text-sm transition-colors border-b-2",
            userType === type
              ? "border-button-info text-primary-text"
              : "border-transparent text-secondary-text hover:text-primary-text",
          ].join(" ")}
        >
          {type === "discord" ? (
            <DiscordIcon className="h-4 w-4" />
          ) : (
            <RobloxIcon className="h-4 w-4" />
          )}
          {type === "discord" ? "Discord" : "Roblox"}
        </button>
      ))}
    </div>
  );
}
