import { useState } from "react";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { formatShortDate } from "@/utils/timestamp";
import { UserSettings, UserPresence } from "@/types/auth";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface RobloxUserCardProps {
  user: {
    id: string;
    roblox_id?: string | null;
    roblox_username?: string;
    roblox_display_name?: string;
    roblox_avatar?: string;
    roblox_join_date?: number;
    settings?: UserSettings;
    presence?: UserPresence;
    usernumber: number;
    premiumtype?: number;
  };
}

export default function RobloxUserCard({ user }: RobloxUserCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";

  return (
    <div className="flex items-center space-x-3">
      {!avatarError && user.roblox_avatar ? (
        <div className="bg-tertiary-bg relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CircularProgress
                size={24}
                sx={{ color: "var(--color-button-info)" }}
              />
            </div>
          )}
          <div className="absolute inset-0">
            <Image
              src={user.roblox_avatar}
              alt={`${user.roblox_display_name || user.roblox_username || "Roblox"} user's profile picture`}
              fill
              draggable={false}
              className="object-cover"
              onError={() => setAvatarError(true)}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      ) : (
        <div className="bg-tertiary-bg flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
          <RobloxIcon className="text-primary-text h-6 w-6" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h2 className="text-primary-text group-hover:text-link max-w-[180px] truncate text-base font-semibold transition-colors sm:max-w-[250px]">
            {user.roblox_display_name || user.roblox_username || "Roblox User"}
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
                className="cursor-pointer object-contain hover:opacity-90"
              />
            </Tooltip>
          ) : null}
          {user.usernumber <= 100 ? (
            <Tooltip
              title="Early Adopter"
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
                src={`${BADGE_BASE_URL}/jbcl_early_adopter.svg`}
                alt="Early Adopter"
                width={16}
                height={16}
                className="cursor-pointer object-contain hover:opacity-90"
              />
            </Tooltip>
          ) : null}
        </div>
        <p className="text-secondary-text max-w-[180px] truncate text-sm sm:max-w-[250px]">
          @{user.roblox_username || "unknown"}
        </p>
        <p className="text-tertiary-text text-sm">
          {user.roblox_join_date
            ? `Joined ${formatShortDate(user.roblox_join_date)}`
            : "Unknown join date"}
        </p>
      </div>
    </div>
  );
}
