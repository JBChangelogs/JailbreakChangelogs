import { UserAvatar } from "@/utils/avatar";
import { UserSettings } from "@/types/auth";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { TrophyIcon } from "@heroicons/react/24/solid";

interface DiscordUserCardProps {
  user: {
    id: string;
    username: string;
    avatar: string;
    global_name: string;
    usernumber: number;
    accent_color: string;
    custom_avatar?: string;
    settings?: UserSettings;
    premiumtype?: number;
  };
}

export default function DiscordUserCard({ user }: DiscordUserCardProps) {
  return (
    <div className="flex items-center space-x-3">
      <UserAvatar
        userId={user.id}
        avatarHash={user.avatar}
        username={user.username}
        size={12}
        custom_avatar={user.custom_avatar}
        showBadge={false}
        settings={user.settings}
        premiumType={user.premiumtype}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h2 className="text-primary-text hover:text-border-focus max-w-[180px] truncate text-base font-semibold transition-colors sm:max-w-[250px]">
            {user.global_name && user.global_name !== "None"
              ? user.global_name
              : user.username}
          </h2>
          {user.premiumtype &&
          user.premiumtype >= 1 &&
          user.premiumtype <= 3 ? (
            <Tooltip
              title={`Supporter Type ${user.premiumtype}`}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-primary-bg)",
                    color: "var(--color-secondary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px var(--color-card-shadow)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-primary-bg)",
                    },
                  },
                },
              }}
            >
              <div
                className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-black hover:opacity-90"
                style={{
                  minWidth: "1rem",
                  minHeight: "1rem",
                  background:
                    user.premiumtype === 1
                      ? "var(--color-badge-premium-bronze)"
                      : user.premiumtype === 2
                        ? "var(--color-badge-premium-silver)"
                        : "var(--color-badge-premium-gold)",
                }}
              >
                <TrophyIcon className="h-3 w-3" />
              </div>
            </Tooltip>
          ) : null}
        </div>
        <p className="text-secondary-text max-w-[180px] truncate text-sm sm:max-w-[250px]">
          @{user.username}
        </p>
      </div>
    </div>
  );
}
