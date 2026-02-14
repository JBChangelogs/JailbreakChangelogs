import React from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/avatar";
import { UserDetailsTooltip } from "@/components/ui/UserDetailsTooltip";
import RobloxTradeUser from "./RobloxTradeUser";
import type { UserData } from "@/types/auth";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";

interface TradeUserProfileProps {
  user: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
    roblox_id?: string;
    roblox_username?: string;
    roblox_display_name?: string;
    roblox_avatar?: string;
    accent_color?: string;
    custom_avatar?: string;
    settings?: {
      avatar_discord: number;
    };
    premiumtype?: number;
  };
}

export default function TradeUserProfile({ user }: TradeUserProfileProps) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="border-border-card bg-tertiary-bg w-fit rounded-lg border p-4">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Discord Profile */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar
                userId={user.id}
                avatarHash={user.avatar || null}
                username={user.username}
                size={10}
                custom_avatar={user.custom_avatar}
                showBadge={false}
                settings={user.settings}
                premiumType={user.premiumtype as unknown as number}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <div className="text-primary-text bg-tertiary-bg/40 border-border-card inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm">
                    <DiscordIcon className="h-3.5 w-3.5" />
                    <span className="text-primary-text text-xs">Discord</span>
                  </div>
                </div>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/users/${user.id}`}
                      prefetch={false}
                      className="text-primary-text hover:text-link font-medium transition-colors"
                    >
                      {user.global_name && user.global_name !== "None"
                        ? user.global_name
                        : user.username}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-sm min-w-[300px] p-0"
                  >
                    <UserDetailsTooltip user={user as UserData} />
                  </TooltipContent>
                </Tooltip>
                <div className="text-secondary-text text-sm">
                  @{user.username}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="bg-secondary-text/60 hidden h-12 w-px sm:block" />

          {/* Roblox Profile */}
          <div className="flex-1">
            <RobloxTradeUser user={user} showBadge={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
