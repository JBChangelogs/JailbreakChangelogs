"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DefaultAvatar } from "@/utils/avatar";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface OGUserInfoProps {
  robloxId: string;
  userConnectionData: UserConnectionData | null;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  originalItemsCount: number;
}

export default function OGUserInfo({
  robloxId,
  userConnectionData,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  originalItemsCount,
}: OGUserInfoProps) {
  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
      <h2 className="text-muted mb-4 text-xl font-semibold">
        User Information
      </h2>

      {/* Roblox User Profile */}
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[#37424D] bg-[#2E3944] p-4 sm:flex-row sm:items-center">
        {getUserAvatar(robloxId) ? (
          <Image
            src={getUserAvatar(robloxId)!}
            alt="Roblox Avatar"
            width={64}
            height={64}
            className="flex-shrink-0 rounded-full bg-[#212A31]"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#37424D]">
            <DefaultAvatar />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-muted text-lg font-bold break-words">
            {getUserDisplay(robloxId)}
          </h3>
          <p className="text-muted text-sm break-words opacity-75">
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
                      backgroundColor: "#0F1419",
                      color: "#D3D9D4",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #2E3944",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      "& .MuiTooltip-arrow": {
                        color: "#0F1419",
                      },
                    },
                  },
                }}
              >
                <a
                  href={`https://discord.com/users/${userConnectionData.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
                >
                  <DiscordIcon className="h-4 w-4 flex-shrink-0 text-[#5865F2]" />
                  <span className="text-sm font-medium">Discord</span>
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
                    backgroundColor: "#0F1419",
                    color: "#D3D9D4",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #2E3944",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "& .MuiTooltip-arrow": {
                      color: "#0F1419",
                    },
                  },
                },
              }}
            >
              <a
                href={`https://www.roblox.com/users/${robloxId}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
              >
                <RobloxIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">Roblox</span>
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
                      backgroundColor: "#0F1419",
                      color: "#D3D9D4",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #2E3944",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      "& .MuiTooltip-arrow": {
                        color: "#0F1419",
                      },
                    },
                  },
                }}
              >
                <Link
                  href={`/users/${userConnectionData.id}`}
                  className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
                >
                  <Image
                    src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                    alt="JBCL Logo"
                    width={16}
                    height={16}
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <span className="text-sm font-medium">Website Profile</span>
                </Link>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Original Items Found */}
      <div className="mt-4 text-center">
        <div className="text-muted text-sm">Original Items Found</div>
        <div className="text-2xl font-bold text-[#4ade80]">
          {(originalItemsCount || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
