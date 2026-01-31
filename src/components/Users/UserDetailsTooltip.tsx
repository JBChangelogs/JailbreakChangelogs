import React from "react";
import Link from "next/link";
import { UserData } from "@/types/auth";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { formatRelativeDate } from "@/utils/timestamp";
import { UserAvatar } from "@/utils/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";

interface UserDetailsTooltipProps {
  user: UserData;
  currentUserId?: string | null;
}

export const UserDetailsTooltip: React.FC<UserDetailsTooltipProps> = ({
  user,
  currentUserId,
}) => {
  return (
    <div
      className="bg-black-800/50 rounded-lg border p-4 shadow-2xl"
      style={{
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderColor: "rgba(107, 114, 128, 0.5)",
        backgroundColor: "rgba(13, 16, 23, 0.75)", // More transparent to see blur effect
      }}
    >
      <div className="flex gap-3">
        {/* User Avatar */}
        <UserAvatar
          userId={user.id}
          avatarHash={user.avatar}
          username={user.username}
          size={16}
          custom_avatar={user.custom_avatar}
          showBadge={false}
          settings={user.settings}
          premiumType={user.premiumtype}
        />
        {/* User Details */}
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <Link
              href={`/users/${user.id}`}
              prefetch={false}
              className="block transition-opacity hover:opacity-80"
            >
              <div className="flex items-center gap-2">
                <h3 className="max-w-[300px] truncate text-lg font-semibold text-white transition-colors">
                  {user.global_name && user.global_name !== "None"
                    ? user.global_name
                    : user.username}
                </h3>
                <UserBadges
                  usernumber={user.usernumber}
                  premiumType={user.premiumtype}
                  flags={user.flags}
                  size="sm"
                />
              </div>
              <p className="text-sm text-gray-300">@{user.username}</p>
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            {/* Connection Badges */}
            {/* Connection Badges */}
            <div className="flex items-center gap-2">
              {/* Discord Connection */}
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border bg-gray-800/30 px-2.5 py-1 text-xs font-medium text-white shadow-sm"
                style={{ borderColor: "rgba(107, 114, 128, 0.5)" }}
              >
                <DiscordIcon className="h-3 w-3" />
                Discord
              </span>
              {/* Roblox Connection */}
              {user.roblox_id && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-gray-800/30 px-2.5 py-1 text-xs font-medium text-white shadow-sm"
                  style={{ borderColor: "rgba(107, 114, 128, 0.5)" }}
                >
                  <RobloxIcon className="h-3 w-3" />
                  Roblox
                </span>
              )}
            </div>
            {user.settings?.profile_public === 0 &&
            currentUserId !== user.id ? (
              <p className="text-sm text-gray-300 italic">Profile is private</p>
            ) : (
              <>
                <p className="text-gray-300">
                  Member #{user.usernumber} since{" "}
                  <span
                    className="relative inline-block cursor-help"
                    onMouseEnter={(e) => {
                      const tooltip =
                        e.currentTarget.querySelector(".tooltip-content");
                      if (tooltip) {
                        const el = tooltip as HTMLElement;
                        el.style.opacity = "1";
                        el.style.backdropFilter = "blur(32px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const tooltip =
                        e.currentTarget.querySelector(".tooltip-content");
                      if (tooltip) (tooltip as HTMLElement).style.opacity = "0";
                    }}
                  >
                    {formatRelativeDate(parseInt(user.created_at) * 1000)}
                    <span
                      className="tooltip-content pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap opacity-0 shadow-2xl transition-opacity duration-200"
                      style={{
                        backgroundColor: "rgba(45, 47, 50, 0.95)",
                        border: "1px solid rgba(107, 114, 128, 0.5)",
                        color: "#ffffff",
                        zIndex: 9999,
                        filter: "blur(0)",
                        backdropFilter: "blur(32px)",
                        WebkitBackdropFilter: "blur(32px)",
                      }}
                    >
                      {new Date(
                        parseInt(user.created_at) * 1000,
                      ).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </span>
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
