"use client";

import Image from "next/image";
import Link from "next/link";
import { UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DupeUserInfoProps {
  robloxId: string;
  userConnectionData: UserConnectionData | null;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
  dupeItemsCount: number;
  totalDupedValue: number;
  hideStats?: boolean;
}

export default function DupeUserInfo({
  robloxId,
  userConnectionData,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  getHasVerifiedBadge,
  dupeItemsCount,
  totalDupedValue,
  hideStats = false,
}: DupeUserInfoProps) {
  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-xl font-semibold">
        User Information
      </h2>

      {/* Roblox User Profile with Ad */}
      <div className="border-border-card bg-tertiary-bg mb-6 flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* User Info Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="bg-tertiary-bg relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
            <Image
              src={getUserAvatar(robloxId)}
              alt="Roblox Avatar"
              width={64}
              height={64}
              className="rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent && !parent.querySelector("svg")) {
                  const defaultAvatar = document.createElement("div");
                  defaultAvatar.className =
                    "flex h-full w-full items-center justify-center";
                  defaultAvatar.innerHTML = `<svg class="h-10 w-10 text-tertiary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="currentColor" /><g transform="translate(12,12) scale(0.92) translate(-12,-12)"><path d="M12 13.5C14.4853 13.5 16.5 11.4853 16.5 9C16.5 6.51472 14.4853 4.5 12 4.5C9.51472 4.5 7.5 6.51472 7.5 9C7.5 11.4853 9.51472 13.5 12 13.5Z" fill="#d3d9d4" /><path d="M12 15C8.13401 15 5 18.134 5 22H19C19 18.134 15.866 15 12 15Z" fill="#d3d9d4" /></g></svg>`;
                  parent.appendChild(defaultAvatar);
                }
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-primary-text text-lg font-bold wrap-break-word">
              <span className="inline-flex items-center gap-2">
                {getUserDisplay(robloxId)}
                {getHasVerifiedBadge(robloxId) && (
                  <VerifiedBadgeIcon className="h-4 w-4" />
                )}
              </span>
            </h3>
            <p className="text-primary-text text-sm wrap-break-word opacity-75">
              @{getUsername(robloxId)}
            </p>

            {/* Connection Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Discord Profile */}
              {userConnectionData && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`https://discord.com/users/${userConnectionData.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                    >
                      <DiscordIcon className="text-border-focus h-3.5 w-3.5 shrink-0" />
                      <span className="text-sm font-semibold">Discord</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Visit Discord Profile</TooltipContent>
                </Tooltip>
              )}

              {/* Roblox Profile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`https://www.roblox.com/users/${robloxId}/profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  >
                    <RobloxIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm font-semibold">Roblox</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Visit Roblox Profile</TooltipContent>
              </Tooltip>

              {/* Website Profile */}
              {userConnectionData && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/users/${userConnectionData.id}`}
                      prefetch={false}
                      className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                        alt="JBCL Logo"
                        width={16}
                        height={16}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span className="text-sm font-semibold">Website</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Visit Website Profile</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!hideStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-2 text-sm">
              Dupe Items Found
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-primary-text cursor-help text-2xl font-bold">
                  {dupeItemsCount.toLocaleString()}
                </div>
              </TooltipTrigger>
              <TooltipContent>{dupeItemsCount.toLocaleString()}</TooltipContent>
            </Tooltip>
          </div>
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-2 text-sm">
              Total Duped Value
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-primary-text cursor-help text-2xl font-bold">
                  <span className="sm:hidden">
                    $
                    {totalDupedValue >= 1000000000
                      ? `${(totalDupedValue / 1000000000).toFixed(1)}B`
                      : totalDupedValue >= 1000000
                        ? `${(totalDupedValue / 1000000).toFixed(1)}M`
                        : totalDupedValue >= 1000
                          ? `${(totalDupedValue / 1000).toFixed(1)}K`
                          : totalDupedValue.toLocaleString()}
                  </span>
                  <span className="hidden sm:inline">
                    ${totalDupedValue.toLocaleString()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                ${totalDupedValue.toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
