"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
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
                  className="border-primary-text text-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
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
                className="border-primary-text text-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
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
                  className="border-primary-text text-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
                >
                  <Image
                    src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                    alt="JBCL Logo"
                    width={16}
                    height={16}
                    className="h-3 w-3 shrink-0"
                  />
                  <span className="text-xs font-medium">Website Profile</span>
                </Link>
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
