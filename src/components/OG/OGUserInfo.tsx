"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DefaultAvatar } from "@/utils/avatar";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

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
  return (
    <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-xl font-semibold">
        User Information
      </h2>

      {/* Roblox User Profile */}
      <div className="border-border-primary bg-primary-bg mb-6 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
        {getUserAvatar(robloxId) ? (
          <Image
            src={getUserAvatar(robloxId)!}
            alt="Roblox Avatar"
            width={64}
            height={64}
            className="flex-shrink-0 rounded-full"
          />
        ) : (
          <div className="bg-surface-bg flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full">
            <DefaultAvatar />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-primary-text text-lg font-bold break-words">
            <span className="inline-flex items-center gap-2">
              {getUserDisplay(robloxId)}
              {getHasVerifiedBadge(robloxId) && (
                <VerifiedBadgeIcon className="h-4 w-4" />
              )}
            </span>
          </h3>
          <p className="text-primary-text text-sm break-words opacity-75">
            @{getUsername(robloxId)}
          </p>

          {/* Connection Icons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Discord Profile */}
            {userConnectionData && (
              <Tooltip
                title="Visit Discord Profile"
                placement="top"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <a
                  href={`https://discord.com/users/${userConnectionData.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-text border-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
                >
                  <DiscordIcon className="h-3 w-3" />
                  <span className="text-xs font-medium">Discord</span>
                </a>
              </Tooltip>
            )}

            {/* Roblox Profile */}
            <Tooltip
              title="Visit Roblox Profile"
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <a
                href={`https://www.roblox.com/users/${robloxId}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-text border-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
              >
                <RobloxIcon className="h-3 w-3" />
                <span className="text-xs font-medium">Roblox</span>
              </a>
            </Tooltip>

            {/* Website Profile */}
            {userConnectionData && (
              <Tooltip
                title="Visit Website Profile"
                placement="top"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <Link
                  href={`/users/${userConnectionData.id}`}
                  prefetch={false}
                  className="text-primary-text border-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
                >
                  <Image
                    src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                    alt="JBCL Logo"
                    width={16}
                    height={16}
                    className="h-3 w-3 flex-shrink-0"
                  />
                  <span className="text-xs font-medium">Website Profile</span>
                </Link>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Original Items Found */}
      <div className="mt-4 text-center">
        <div className="text-secondary-text text-sm">Original Items Found</div>
        <div className="text-primary-text text-2xl font-bold">
          {(originalItemsCount || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
