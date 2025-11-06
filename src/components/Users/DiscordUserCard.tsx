import { UserAvatar } from "@/utils/avatar";
import { UserSettings } from "@/types/auth";
import dynamic from "next/dynamic";
import Image from "next/image";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

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
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";

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
              <Image
                src={`${BADGE_BASE_URL}/jbcl_supporter_${user.premiumtype}.svg`}
                alt={`Supporter Type ${user.premiumtype}`}
                width={16}
                height={16}
                className="cursor-pointer hover:opacity-90 object-contain"
              />
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
