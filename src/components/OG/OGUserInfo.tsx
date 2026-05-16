"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { DefaultAvatar } from "@/utils/ui/avatar";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OGUserInfoProps {
  robloxId: string;
  userConnectionData: UserConnectionData | null;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
  originalItemsCount: number;
}

export default function OGUserInfo({
  robloxId,
  userConnectionData,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  getHasVerifiedBadge,
  originalItemsCount,
}: OGUserInfoProps) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-xl font-semibold">
        User Information
      </h2>

      {/* Roblox User Profile */}
      <div className="border-border-card bg-tertiary-bg mb-6 flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="border-border-card bg-quaternary-bg relative h-16 w-16 shrink-0 overflow-hidden rounded-full border">
          {!avatarError ? (
            <Image
              src={getUserAvatar(robloxId)}
              alt="Roblox Avatar"
              fill
              className="object-cover"
              unoptimized
              onError={() => setAvatarError(true)}
            />
          ) : (
            <DefaultAvatar />
          )}
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

          {/* Connection Icons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Discord Profile */}
            {userConnectionData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`https://discord.com/users/${userConnectionData.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-quaternary-bg border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  >
                    <DiscordIcon className="text-border-focus h-3.5 w-3.5 shrink-0" />
                    Discord
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Discord profile</TooltipContent>
              </Tooltip>
            )}

            {/* Roblox Profile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`https://www.roblox.com/users/${robloxId}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-quaternary-bg border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                >
                  <RobloxIcon className="h-3.5 w-3.5 shrink-0" />
                  Roblox
                </Link>
              </TooltipTrigger>
              <TooltipContent>Roblox profile</TooltipContent>
            </Tooltip>

            {/* Website Profile */}
            {userConnectionData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/users/${userConnectionData.id}`}
                    prefetch={false}
                    className="bg-quaternary-bg border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  >
                    <Image
                      src="https://assets.jailbreakchangelogs.com/assets/logos/JBCL_Short_Transparent.webp"
                      alt="JBCL Logo"
                      width={16}
                      height={16}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    Website
                  </Link>
                </TooltipTrigger>
                <TooltipContent>JBCL profile</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Action Buttons & Stats */}
        <div className="mt-4 flex flex-col items-center gap-4 sm:mt-0 sm:ml-auto sm:flex-col sm:items-end">
          {/* Original Items Found */}
          <div className="text-center sm:text-right">
            <div className="text-secondary-text text-sm">Original Items</div>
            <div className="text-primary-text text-2xl font-bold">
              {(originalItemsCount || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
