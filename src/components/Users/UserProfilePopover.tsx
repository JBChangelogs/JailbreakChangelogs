"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { UserBadges } from "@/components/Profile/UserBadges";
import { getProfileBanner } from "@/components/Profile/Banner";
import { useSafeAuthContext } from "@/contexts/AuthContext";
import { useFriendship } from "@/hooks/useFriendship";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import type { UserFlag } from "@/types/auth";
import { accentCardTheme, userCardAccent } from "@/utils/ui/accentColor";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";

const NO_DESCRIPTION = "No description provided";
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/** Settings as the various user endpoints send them (some use 0/1). */
type LooseSettings = Partial<
  Record<
    | "hide_presence"
    | "custom_avatar"
    | "custom_banner"
    | "custom_background"
    | "colored_profile_cards",
    unknown
  >
>;

/**
 * Whatever user object the page already has. Only `id` is needed; the rest
 * is shown until /v2/users/{id} loads.
 */
export interface PopoverUser {
  id?: string | number;
  username?: string;
  global_name?: string | null;
  avatar?: string | null;
  custom_avatar?: string | null;
  premiumtype?: number;
  usernumber?: number | null;
  flags?: UserFlag[];
  presence?: { status?: string } | null;
  settings_v2?: LooseSettings | null;
  settings?: LooseSettings | null;
}

type FullProfile = Omit<PopoverUser, "id"> & {
  id: string;
  banner?: string | null;
  custom_banner?: string | null;
  accent_color?: number | string | null;
  created_at?: string;
  roblox_id?: string | null;
  custom_accent_color?: string | null;
  accent_gradient?: number | string | null;
  accent_style?: string | null;
  custom_background?: string | null;
};

async function fetchDescription(userId: string): Promise<string | null> {
  const res = await fetch(`${PUBLIC_API_URL}/v2/users/${userId}/description`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const { description } = (await res.json()) as { description?: string };
  return description && description !== NO_DESCRIPTION ? description : null;
}

const CHIP =
  "border-border-card bg-tertiary-bg text-primary-text hover:bg-quaternary-bg/60 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Add Friend → Pending (cancel) → Accept/Decline (they asked) → Friends (remove). */
export function FriendButton({
  userId,
  size = "sm",
  hideWhenFriends = false,
}: {
  userId: string;
  size?: "sm" | "md";
  /** Profiles put Remove Friend in their menu instead. */
  hideWhenFriends?: boolean;
}) {
  const { status, isLoading, isMutating, add, cancel, remove } =
    useFriendship(userId);
  if (isLoading || (hideWhenFriends && status === "friends")) return null;

  if (status === "none") {
    return (
      <Button size={size} disabled={isMutating} onClick={add}>
        <Icon icon="heroicons:user-plus" inline />
        Add Friend
      </Button>
    );
  }

  if (status === "incoming") {
    return (
      <div className="flex gap-1.5">
        <Button
          size={size}
          variant="success"
          disabled={isMutating}
          onClick={add}
        >
          <Icon icon="heroicons:check" inline />
          Accept
        </Button>
        <Button
          size={size}
          variant="secondary"
          className={size === "sm" ? "w-8! px-0!" : "w-10! px-0!"}
          disabled={isMutating}
          onClick={cancel}
          aria-label="Decline friend request"
        >
          <Icon icon="heroicons:x-mark" inline />
        </Button>
      </div>
    );
  }

  // Pending and Friends show the undo action on hover, so a click isn't a surprise.
  const pending = status === "outgoing";
  return (
    <Button
      size={size}
      variant="secondary"
      className="group/friend"
      disabled={isMutating}
      onClick={pending ? cancel : remove}
      aria-label={pending ? "Cancel friend request" : "Remove friend"}
    >
      <span className="inline-flex items-center gap-1.5 group-hover/friend:hidden">
        <Icon icon={pending ? "heroicons:clock" : "heroicons:check"} inline />
        {pending ? "Pending" : "Friends"}
      </span>
      <span className="hidden items-center gap-1.5 group-hover/friend:inline-flex">
        <Icon
          icon={pending ? "heroicons:x-mark" : "heroicons:user-minus"}
          inline
        />
        {pending ? "Cancel" : "Remove"}
      </span>
    </Button>
  );
}

function Description({ text }: { text: string }) {
  return (
    <p className="text-primary-text/90 mt-3 line-clamp-5 text-sm break-words whitespace-pre-wrap">
      {text
        .replace(/\p{M}+/gu, "")
        .split(URL_PATTERN)
        .map((part, i) =>
          i % 2 === 1 ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover hover:underline"
            >
              {part}
            </a>
          ) : (
            part
          ),
        )}
    </p>
  );
}

function PopoverBanner({
  user,
  hidePersonal,
}: {
  user: FullProfile;
  hidePersonal: boolean;
}) {
  const { primary, fallback } = getProfileBanner({
    userId: user.id,
    banner: hidePersonal ? null : user.banner,
    customBanner: hidePersonal ? null : user.custom_banner,
    settings: (user.settings_v2 ?? user.settings ?? undefined) as never,
    premiumType: user.premiumtype,
    size: 600,
  });
  const [failed, setFailed] = useState(false);
  const src = primary && !failed ? primary : fallback;
  return (
    <div className="relative h-24 w-full">
      <Image
        src={src}
        alt=""
        fill
        draggable={false}
        onError={src === primary ? () => setFailed(true) : undefined}
        className="object-cover"
      />
    </div>
  );
}

/**
 * The desktop app's profile card, opened by clicking a user's avatar or name.
 * Wrap the existing profile link: a plain click opens the card, a modified or
 * middle click still opens the profile. Shows `user` until the full profile
 * loads; presence stays live from `user`.
 */
export function UserProfilePopover({
  user,
  children,
}: {
  user: PopoverUser;
  children: React.ReactNode;
}) {
  // Safe: the popover also renders where there is no AuthProvider (tests, previews).
  const auth = useSafeAuthContext();
  const currentUser = auth?.user;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const userId = String(user.id ?? "");

  const full = useQuery({
    queryKey: ["user-popover", userId],
    queryFn: async () => {
      const [profile, description] = await Promise.all([
        fetchUserById(userId, PUBLIC_API_URL) as Promise<FullProfile | null>,
        fetchDescription(userId).catch(() => null),
      ]);
      if (!profile) throw new Error("Failed to load profile");
      return { profile, description };
    },
    enabled: open && userId !== "",
    staleTime: 5 * 60_000,
    retry: false,
  });

  const profile: FullProfile = full.data
    ? {
        ...full.data.profile,
        presence: user.presence ?? full.data.profile.presence,
      }
    : { ...user, id: userId };
  const settings = profile.settings_v2 ?? profile.settings ?? undefined;
  const isOwn = currentUser?.id === userId;
  // Presence and their own banner wait for the full profile; the page's user
  // may carry both.
  const hidePersonal = !full.data;
  const showPresence = !hidePersonal && !settings?.hide_presence;
  const username = profile.username ?? `User #${userId.slice(-6)}`;
  // Their profile's look, as on /users/{id}: the background behind the whole
  // card, and the card coloured with their accent.
  const accent = userCardAccent({
    ...profile,
    settings_v2: {
      colored_profile_cards: settings?.colored_profile_cards === true,
    },
  });
  const background =
    settings?.custom_background === true ? profile.custom_background : null;
  // The avatar's ring is cut out in whatever the card is filled with.
  const surface = accent
    ? "bg-secondary-bg"
    : background
      ? undefined
      : "bg-primary-bg";

  return (
    // The trigger opens it; Radix may only close it. Otherwise a modified
    // click, which skips preventDefault, would toggle it open as well.
    <Popover modal open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <PopoverTrigger
        asChild
        onClickCapture={(e) => {
          if (
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey ||
            e.button !== 0
          )
            return;
          // Intercept before link handlers and the document's navigation loader.
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={12}
        collisionPadding={12}
        className="relative isolate z-[10001] max-h-(--radix-popover-content-available-height) w-80 max-w-[calc(100vw-24px)] overflow-x-hidden overflow-y-auto rounded-2xl p-0"
        data-accent-cards={accent?.style}
        style={accent ? accentCardTheme(accent) : undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {background && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <Image
              src={background}
              alt=""
              fill
              sizes="320px"
              unoptimized
              draggable={false}
              className="object-cover object-top"
            />
            <div className="bg-primary-bg/85 absolute inset-0" />
          </div>
        )}
        <div className={cn("relative", accent && "bg-secondary-bg")}>
          <PopoverBanner
            key={`${profile.id}:${profile.custom_banner ?? profile.banner}:${hidePersonal}`}
            user={profile}
            hidePersonal={hidePersonal}
          />
          <div className="relative px-4">
            {/* Overlaps the banner with a ring cut out in the card's colour. */}
            <div
              className={cn(
                "relative -mt-11 w-fit p-1",
                surface,
                profile.premiumtype === 3 ? "rounded-[28%]" : "rounded-full",
              )}
            >
              <UserAvatar
                userId={profile.id}
                avatarHash={profile.avatar ?? null}
                username={username}
                custom_avatar={profile.custom_avatar ?? undefined}
                settings={{
                  custom_avatar: settings?.custom_avatar === true,
                  hide_presence: Boolean(settings?.hide_presence),
                }}
                premiumType={profile.premiumtype}
                size={20}
                showBadge={showPresence}
                isOnline={profile.presence?.status === "Online"}
                bgClassName="bg-tertiary-bg"
                presenceBadgeClassName={cn(
                  "bg-status-success-vibrant",
                  accent
                    ? "border-secondary-bg"
                    : background
                      ? "border-transparent"
                      : "border-primary-bg",
                )}
              />
            </div>
          </div>
          <div className="px-4 pt-2 pb-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-primary-text truncate text-xl leading-tight font-bold">
                  {profile.global_name && profile.global_name !== "None"
                    ? profile.global_name
                    : username}
                </h3>
                <p className="text-secondary-text mt-0.5 truncate text-sm">
                  {username}
                </p>
              </div>
              {isAuthenticated && !isOwn && (
                <div className="shrink-0">
                  <FriendButton userId={profile.id} />
                </div>
              )}
            </div>
            {profile.usernumber != null && (
              <div className="mt-2">
                <UserBadges
                  usernumber={profile.usernumber}
                  premiumType={profile.premiumtype}
                  flags={profile.flags}
                  size="sm"
                />
              </div>
            )}
            {full.data?.description && (
              <Description text={full.data.description} />
            )}
            {profile.usernumber != null && profile.created_at && (
              <div className="mt-3">
                <p className="text-secondary-text text-xs font-bold">
                  Member Since
                </p>
                <p className="text-primary-text/90 mt-0.5 text-sm">
                  {new Date(
                    Number(profile.created_at) * 1000,
                  ).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  <span className="text-tertiary-text">
                    {" "}
                    · Member #{profile.usernumber}
                  </span>
                </p>
              </div>
            )}
            {full.isError && (
              <p className="text-quaternary-text mt-3 text-xs">
                Failed to load the full profile.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Link
                href={`/users/${profile.id}`}
                prefetch={false}
                className={CHIP}
                onClick={() => setOpen(false)}
              >
                <Icon icon="heroicons:user" className="h-3.5 w-3.5" inline />
                Profile
              </Link>
              <a
                href={`https://discord.com/users/${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={CHIP}
              >
                <Icon
                  icon="ic:baseline-discord"
                  className="h-3.5 w-3.5"
                  inline
                />
                Discord
              </a>
              {profile.roblox_id && (
                <a
                  href={`https://www.roblox.com/users/${profile.roblox_id}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CHIP}
                >
                  <Icon
                    icon="simple-icons:roblox"
                    className="h-3.5 w-3.5"
                    inline
                  />
                  Roblox
                </a>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
