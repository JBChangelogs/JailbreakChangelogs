import React from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/avatar";
import { TradeUserTooltip } from "./TradeUserTooltip";
import RobloxTradeUser from "./RobloxTradeUser";

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
      <div className="border-border-primary bg-primary-bg w-fit rounded-lg border p-4">
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
                  <div className="bg-secondary-bg flex items-center gap-1.5 rounded px-1.5 py-0.5">
                    <svg
                      className="text-button-info h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span className="text-primary-text text-xs">Discord</span>
                  </div>
                </div>
                <Tooltip>
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
                    side="bottom"
                    className="bg-secondary-bg text-primary-text max-w-[400px] min-w-[300px] border-none shadow-[var(--color-card-shadow)]"
                  >
                    <TradeUserTooltip user={user} />
                  </TooltipContent>
                </Tooltip>
                <div className="text-secondary-text text-sm">
                  @{user.username}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="bg-button-info/60 hidden h-12 w-px sm:block" />

          {/* Roblox Profile */}
          <div className="flex-1">
            <RobloxTradeUser user={user} showBadge={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
