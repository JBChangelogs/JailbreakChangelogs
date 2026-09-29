"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/ui/avatar";
import type { TrackerJoinUser } from "@/hooks/trackerJoinHistory";
import type { UserData } from "@/types/auth";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { cn } from "@/lib/utils";

function usable(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "None" && trimmed !== "N/A" ? trimmed : null;
}

function getIdentity(user: TrackerJoinUser, details?: UserData) {
  const connectedToRoblox = Boolean(usable(details?.roblox_id));
  const siteUsername = usable(details?.username) ?? String(user.user_id);
  const robloxUsername = connectedToRoblox
    ? usable(details?.roblox_username)
    : null;

  return {
    name: connectedToRoblox
      ? (usable(details?.roblox_display_name) ?? robloxUsername ?? siteUsername)
      : (usable(details?.global_name) ?? siteUsername),
    username: robloxUsername ?? siteUsername,
    avatarUrl: connectedToRoblox
      ? (usable(details?.roblox_avatar) ?? undefined)
      : undefined,
  };
}

export default function JoinedUsers({
  users,
  variant = "robbery",
}: {
  users: TrackerJoinUser[];
  variant?: "robbery" | "bounty";
}) {
  const isBounty = variant === "bounty";
  const userIds = users.map((user) => String(user.user_id)).sort();
  const { data: userDetails } = useQuery({
    queryKey: ["tracker-joined-users", userIds],
    queryFn: async () => {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/users/get/batch?ids=${userIds.map(encodeURIComponent).join(",")}`,
      );
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Could not load joined users");
      const results = (await response.json()) as UserData[];
      return Object.fromEntries(results.map((user) => [user.id, user]));
    },
    enabled: users.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (users.length === 0) return null;

  const identityFor = (user: TrackerJoinUser) =>
    getIdentity(user, userDetails?.[String(user.user_id)]);
  const tooltipFor = (user: TrackerJoinUser) => {
    const { name, username } = identityFor(user);
    return name.toLowerCase() === username.toLowerCase()
      ? `@${username}`
      : `${name} (@${username})`;
  };

  return (
    <div
      className={cn(
        "text-primary-text mt-2 flex min-w-0 items-center font-medium",
        isBounty ? "gap-3 text-sm" : "gap-2 text-xs",
      )}
    >
      <div className="flex shrink-0 -space-x-2" aria-hidden="true">
        {users.slice(0, 3).map((user) => (
          <Tooltip key={String(user.user_id)} delayDuration={400}>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                <UserAvatar
                  userId={String(user.user_id)}
                  avatarHash={
                    userDetails?.[String(user.user_id)]?.avatar ?? null
                  }
                  username={identityFor(user).username}
                  forceAvatarUrl={identityFor(user).avatarUrl}
                  premiumType={userDetails?.[String(user.user_id)]?.premiumtype}
                  custom_avatar={
                    userDetails?.[String(user.user_id)]?.custom_avatar
                  }
                  settings={userDetails?.[String(user.user_id)]?.settings}
                  size={isBounty ? 7 : 6}
                  cdnSize={64}
                  showBadge={false}
                  bgClassName={isBounty ? "bg-quaternary-bg" : "bg-tertiary-bg"}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{tooltipFor(user)}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      {users.length === 1 ? (
        <span className="min-w-0 truncate">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Link
                href={`/users/${encodeURIComponent(String(users[0].user_id))}`}
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline-offset-2 hover:underline"
              >
                {identityFor(users[0]).name}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">{tooltipFor(users[0])}</TooltipContent>
          </Tooltip>{" "}
          joined
        </span>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="hover:text-link cursor-pointer underline-offset-2 hover:underline"
              aria-label={`View ${users.length} people who joined this server`}
            >
              {users.length} people joined
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <p className="text-secondary-text mb-2 text-xs font-semibold">
              Joined from this website
            </p>
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={String(user.user_id)}
                  className="flex items-center gap-2"
                >
                  <UserAvatar
                    userId={String(user.user_id)}
                    avatarHash={
                      userDetails?.[String(user.user_id)]?.avatar ?? null
                    }
                    username={identityFor(user).username}
                    forceAvatarUrl={identityFor(user).avatarUrl}
                    premiumType={
                      userDetails?.[String(user.user_id)]?.premiumtype
                    }
                    custom_avatar={
                      userDetails?.[String(user.user_id)]?.custom_avatar
                    }
                    settings={userDetails?.[String(user.user_id)]?.settings}
                    size={7}
                    cdnSize={64}
                    showBadge={false}
                    bgClassName={
                      isBounty ? "bg-quaternary-bg" : "bg-secondary-bg"
                    }
                  />
                  <Link
                    href={`/users/${encodeURIComponent(String(user.user_id))}`}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate underline-offset-2 hover:underline"
                  >
                    <span className="text-link hover:text-link-hover block truncate text-sm">
                      {identityFor(user).name}
                    </span>
                    <span className="text-secondary-text block truncate text-xs">
                      @{identityFor(user).username}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
