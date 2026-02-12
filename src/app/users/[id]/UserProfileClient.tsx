"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Error from "next/error";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/utils/avatar";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Skeleton } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Icon } from "../../../components/ui/IconWrapper";
import { Banner } from "@/components/Profile/Banner";
import { UserSettings, FollowingData } from "@/types/auth";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { PUBLIC_API_URL } from "@/utils/api";

import { UserBadges } from "@/components/Profile/UserBadges";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatShortDate, formatCustomDate } from "@/utils/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import ProfileTabs from "@/components/Profile/ProfileTabs";
import { useAuthContext } from "@/contexts/AuthContext";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
const FollowersModal = dynamic(
  () => import("@/components/Users/FollowersModal"),
  {
    ssr: false,
  },
);

const FollowingModal = dynamic(
  () => import("@/components/Users/FollowingModal"),
  {
    ssr: false,
  },
);
import type { UserFlag } from "@/types/auth";

// Global audio instance to prevent overlapping playback
let globalSuperIdolAudio: HTMLAudioElement | null = null;
let isPlaying = false;

const LinSuperIdol = ({ userId }: { userId: string }) => {
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    if (userId === "231616789979594754") {
      // Create audio instance only if it doesn't exist
      if (!globalSuperIdolAudio) {
        globalSuperIdolAudio = new Audio("/assets/audios/super_idol.mp3");
        globalSuperIdolAudio.volume = 0.7;

        // Handle when audio ends
        globalSuperIdolAudio.onended = () => {
          isPlaying = false;
          globalSuperIdolAudio!.currentTime = 0;
        };

        // Handle errors
        globalSuperIdolAudio.onerror = () => {
          isPlaying = false;
          setShowPlayButton(true);
        };
      }

      // Defer state updates to avoid cascading renders
      setTimeout(() => {
        // If audio is already playing, stop it and restart
        if (isPlaying && globalSuperIdolAudio) {
          globalSuperIdolAudio.pause();
          globalSuperIdolAudio.currentTime = 0;
          isPlaying = false;
        }

        // Play the audio
        if (globalSuperIdolAudio && !isPlaying) {
          globalSuperIdolAudio
            .play()
            .then(() => {
              isPlaying = true;
              setShowPlayButton(false);
            })
            .catch(() => {
              isPlaying = false;
              setShowPlayButton(true);
            });
        }
      }, 0);

      return () => {
        if (globalSuperIdolAudio && isPlaying) {
          globalSuperIdolAudio.pause();
          globalSuperIdolAudio.currentTime = 0;
          isPlaying = false;
        }
      };
    }
  }, [userId]);

  const handlePlayClick = () => {
    if (globalSuperIdolAudio) {
      // If already playing, stop and restart
      if (isPlaying) {
        globalSuperIdolAudio.pause();
        globalSuperIdolAudio.currentTime = 0;
        isPlaying = false;
      }

      globalSuperIdolAudio
        .play()
        .then(() => {
          isPlaying = true;
          setShowPlayButton(false);
        })
        .catch(() => {
          isPlaying = false;
        });
    }
  };

  if (!showPlayButton) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handlePlayClick}
            className="bg-secondary-bg/80 text-primary-text/80 group hover:bg-secondary-bg hover:text-primary-text cursor-pointer rounded-full p-3 shadow-lg backdrop-blur-sm transition-all duration-300"
          >
            <Icon
              icon="material-symbols:music-note"
              className="text-xl opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              inline={true}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>Lin is a super idol</TooltipContent>
      </Tooltip>
    </div>
  );
};

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  owner?: string;
  parent_id?: number | null;
}

interface Server {
  id: number;
  link: string;
  owner: string;
  rules: string;
  expires: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  banner?: string;
  custom_banner?: string;
  settings?: UserSettings;
  presence?: {
    status: "Online" | "Offline";
    last_updated: number;
  };
  premiumtype?: number;
  is_following?: boolean;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  last_seen?: number | null;
  bio?: string;
  bio_last_updated?: number;
  roblox_id: string | null;
  roblox_username?: string;
  flags?: UserFlag[];
  primary_guild?: {
    tag: string | null;
    badge: string | null;
    identity_enabled: boolean;
    identity_guild_id: string | null;
  } | null;
}

interface FavoriteItem {
  item_id: string;
  created_at: number;
  author: string;
  item?: {
    id: number;
    name?: string;
    type?: string;
    parent?: number;
    sub_name?: string;
    data?: {
      name: string;
      type: string;
    };
  };
}

interface TradeItem {
  id: number;
  name: string;
  type: string;
  creator: string;
  is_seasonal: number;
  cash_value: string;
  duped_value: string;
  price: string;
  is_limited: number;
  duped_owners: string;
  notes: string;
  demand: string;
  description: string;
  health: number;
  tradable: number;
  last_updated: number;
}

interface TradeAd {
  id: number;
  requesting: TradeItem[];
  offering: TradeItem[];
  author: string;
  created_at: number;
  expires: number | null;
  expired: number;
  status: string;
}

interface UserProfileData {
  user: User;
  followerCount: number;
  followingCount: number;
  bio: string | null;
  bioLastUpdated: number | null;
  comments: CommentData[];
  privateServers: Server[];
  favorites: FavoriteItem[];
  favoriteItemDetails: Record<string, unknown>;
  tradeAds: TradeAd[];
}

interface UserProfileClientProps {
  userId: string;
  initialData?: UserProfileData;
  error?: { message: string; code: number };
  isLoadingAdditionalData?: boolean;
  additionalDataError?: string;
}

export default function UserProfileClient({
  userId,
  initialData,
  error,
  isLoadingAdditionalData = false,
  additionalDataError,
}: UserProfileClientProps) {
  const { user: currentUser } = useAuthContext();
  const [user, setUser] = useState<User | null>(initialData?.user || null);
  const [loading] = useState(!initialData && !error);
  const [errorState] = useState<string | null>(error?.message || null);
  const [errorCode] = useState<number | null>(error?.code || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [followerCount, setFollowerCount] = useState(
    initialData?.followerCount || 0,
  );
  const [followingCount, setFollowingCount] = useState(
    initialData?.followingCount || 0,
  );
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [bio, setBio] = useState<string | null>(initialData?.bio || null);
  const [bioLastUpdated, setBioLastUpdated] = useState<number | null>(
    initialData?.bioLastUpdated || null,
  );
  const [comments] = useState<CommentData[]>(initialData?.comments || []);
  const [commentsLoading] = useState(!initialData);
  const [commentsError] = useState<string | null>(null);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [privateServers] = useState<Server[]>(
    initialData?.privateServers || [],
  );
  const [favorites] = useState<FavoriteItem[]>(initialData?.favorites || []);
  const [favoriteItemDetails] = useState<Record<string, unknown>>(
    initialData?.favoriteItemDetails || {},
  );
  const [tradeAds] = useState<TradeAd[]>(initialData?.tradeAds || []);

  // Use realtime relative date for last seen timestamp
  const lastSeenTime = useOptimizedRealTimeRelativeDate(
    user?.last_seen,
    `user-last-seen-${user?.id || "unknown"}`,
  );

  const refreshBio = async (newBio: string) => {
    setBio(newBio);
    setBioLastUpdated(Date.now());
  };

  useEffect(() => {
    if (currentUser) {
      setCurrentUserId(currentUser.id);
      setIsAuthenticatedUser(true);
    } else {
      setCurrentUserId(null);
      setIsAuthenticatedUser(false);
    }
  }, [currentUser]);

  // Update following status when currentUserId changes
  useEffect(() => {
    const updateFollowingStatus = async () => {
      if (currentUserId && user) {
        try {
          const response = await fetch(
            `${PUBLIC_API_URL}/users/following/get?user=${currentUserId}`,
            {
              headers: {
                "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
              },
            },
          );
          const followingData: FollowingData[] | string = await response.json();

          const isUserFollowing =
            Array.isArray(followingData) &&
            followingData.some(
              (followedUser) =>
                followedUser.user_id === currentUserId &&
                followedUser.following_id === userId,
            );
          setIsFollowing(isUserFollowing);
        } catch (error: unknown) {
          console.error("Error fetching following status:", error);
        }
      }
    };

    updateFollowingStatus();
  }, [currentUserId, userId, user]);

  const handleFollow = async () => {
    if (isLoadingFollow) return;

    setIsLoadingFollow(true);
    try {
      if (!currentUserId) {
        toast.error("You need to be logged in to follow users");
        setIsLoadingFollow(false);
        return;
      }

      let response;

      if (isFollowing) {
        response = await fetch(`/api/users/followers/remove`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ following: userId }),
        });
      } else {
        response = await fetch(`/api/users/followers/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ following: userId }),
        });
      }

      if (!response.ok) {
        const errorMessage = isFollowing
          ? "Failed to unfollow user"
          : "Failed to follow user";
        toast.error(errorMessage);
        return;
      }

      setIsFollowing(!isFollowing);

      if (isFollowing) {
        setFollowerCount((prevCount) => Math.max(0, prevCount - 1));
      } else {
        setFollowerCount((prevCount) => prevCount + 1);
      }

      if (user) {
        setUser({ ...user, is_following: !isFollowing });
      }

      toast.success(
        isFollowing
          ? "Successfully unfollowed user"
          : "Successfully followed user",
      );

      window.umami?.track(isFollowing ? "Unfollow User" : "Follow User", {
        location: "User Profile",
      });
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error(
        isFollowing ? "Failed to unfollow user" : "Failed to follow user",
      );
    } finally {
      setIsLoadingFollow(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 max-w-7xl">
          <Breadcrumb loading={true} />
          <div className="border-border-card overflow-hidden rounded-lg border shadow-md">
            {/* Banner skeleton */}
            <Skeleton variant="rectangular" height={256} />

            {/* Profile Content skeleton */}
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-6">
                {/* Avatar skeleton */}
                <div className="relative -mt-16 md:-mt-24">
                  <Skeleton variant="circular" width={96} height={96} />
                </div>

                <div className="w-full flex-1 text-center md:text-left">
                  <div className="flex flex-col items-center justify-between md:flex-row md:items-start">
                    <div>
                      {/* Username skeleton */}
                      <Skeleton variant="text" width={160} height={28} />
                      {/* Handle skeleton */}
                      <Skeleton variant="text" width={128} height={16} />
                      {/* Last seen skeleton */}
                      <Skeleton variant="text" width={192} height={12} />
                      {/* Member since skeleton */}
                      <Skeleton variant="text" width={224} height={12} />

                      {/* Follower/Following skeleton */}
                      <div className="mt-2 flex items-center justify-center space-x-4 md:justify-start">
                        <Skeleton variant="text" width={80} height={16} />
                        <Skeleton variant="text" width={80} height={16} />
                      </div>

                      {/* Connection icons skeleton */}
                      <div className="mt-2 flex items-center justify-center space-x-3 md:justify-start">
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton variant="circular" width={20} height={20} />
                      </div>
                    </div>

                    {/* Button skeleton */}
                    <Skeleton variant="rounded" width={112} height={40} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs skeleton */}
            <div className="mt-2 md:mt-6">
              <div className="border-b">
                <div className="flex gap-4 overflow-x-auto p-2">
                  <Skeleton variant="rounded" width={80} height={32} />
                  <Skeleton variant="rounded" width={80} height={32} />
                  <Skeleton variant="rounded" width={80} height={32} />
                  <Skeleton variant="rounded" width={80} height={32} />
                </div>
              </div>
              <div className="p-3 sm:p-4">
                {/* Tab content skeleton */}
                <div className="space-y-4">
                  <Skeleton variant="rounded" height={80} />
                  <Skeleton variant="rounded" height={80} />
                  <Skeleton variant="rounded" height={80} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (errorCode) {
    // Handle 403 and 404 errors by calling notFound() to trigger the custom not-found page
    if (errorCode === 403 || errorCode === 404) {
      notFound();
    }

    return <Error statusCode={errorCode} title={errorState || undefined} />;
  }

  if (!user) {
    notFound();
  }

  if (user.settings?.profile_public === 0 && currentUserId !== user.id) {
    return (
      <main className="min-h-screen pb-8">
        <div className="container mx-auto">
          <Breadcrumb userData={user} />
          <div className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border shadow-md">
            <div className="p-8">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative -mt-6">
                  <UserAvatar
                    userId={user.id}
                    avatarHash={user.avatar}
                    username={user.username}
                    size={38}
                    custom_avatar={user.custom_avatar}
                    showBadge={false}
                    settings={user.settings}
                    premiumType={user.premiumtype}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:flex-wrap">
                    <h1 className="text-primary-text text-xl font-bold md:text-2xl">
                      {user.global_name && user.global_name !== "None"
                        ? user.global_name
                        : user.username}
                    </h1>
                    <div className="md:ml-0">
                      <UserBadges
                        usernumber={user.usernumber}
                        premiumType={user.premiumtype}
                        flags={user.flags}
                        size="lg"
                        primary_guild={user.primary_guild}
                      />
                    </div>
                  </div>
                  <p className="text-secondary-text">@{user.username}</p>
                </div>
                <div className="w-full max-w-md rounded-lg p-6 text-center">
                  <div className="mb-4 flex items-center justify-center space-x-3">
                    <svg
                      className="text-primary-text h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h2 className="text-primary-text text-lg font-semibold">
                      Private Profile
                    </h2>
                  </div>
                  <p className="text-secondary-text">
                    This user has chosen to keep their profile private
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-8">
      <LinSuperIdol userId={userId} />
      <div className="container mx-auto max-w-7xl">
        <Breadcrumb userData={user} />
        <div className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border shadow-md">
          {/* Banner Section */}
          <Banner
            userId={user.id}
            username={user.username}
            banner={user.banner}
            customBanner={user.custom_banner}
            settings={user.settings}
            premiumType={user.premiumtype}
          />

          {/* Profile Content */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-6">
              {/* Avatar - smaller on mobile */}
              <div className="relative -mt-14 md:-mt-24">
                <UserAvatar
                  userId={user.id}
                  avatarHash={user.avatar}
                  username={user.username}
                  size={38}
                  custom_avatar={user.custom_avatar}
                  isOnline={
                    user.settings?.hide_presence === 1 &&
                    currentUserId !== user.id
                      ? false
                      : user.presence?.status === "Online"
                  }
                  showBadge={true}
                  settings={user.settings}
                  premiumType={user.premiumtype}
                />
              </div>
              <div className="w-full flex-1">
                <div className="flex flex-col justify-between md:flex-row">
                  <div className="w-full text-center md:w-auto md:text-left">
                    <div className="flex max-w-full flex-col items-center justify-center gap-2 md:flex-row md:flex-wrap md:justify-start">
                      <h1 className="text-primary-text mb-1 max-w-[280px] truncate text-2xl font-bold md:text-3xl lg:max-w-none">
                        {user.global_name && user.global_name !== "None"
                          ? user.global_name
                          : user.username}
                      </h1>
                      <div className="md:ml-0">
                        <UserBadges
                          usernumber={user.usernumber}
                          premiumType={user.premiumtype}
                          flags={user.flags}
                          size="lg"
                          primary_guild={user.primary_guild}
                        />
                      </div>
                    </div>
                    <p className="text-secondary-text mx-auto mb-1 max-w-[280px] truncate text-lg md:mx-0 lg:max-w-none">
                      @{user.username}
                    </p>

                    {isLoadingAdditionalData ? (
                      <Skeleton variant="text" width="60%" height={16} />
                    ) : (
                      <>
                        {user.settings?.hide_presence === 1 &&
                        currentUserId !== user.id ? (
                          <p className="text-secondary-text text-sm">
                            Last seen: Hidden
                          </p>
                        ) : user.presence?.status === "Online" ? (
                          <p
                            className="text-sm"
                            style={{
                              color: "var(--color-status-success-vibrant)",
                            }}
                          >
                            Online
                          </p>
                        ) : user.last_seen === null ? (
                          <div className="mt-2 mb-2 rounded-lg p-4">
                            <p className="text-secondary-text mb-1 text-sm font-medium">
                              Are you the owner of this profile?
                            </p>
                            <p className="text-primary-text text-sm">
                              Login to enable status indicators and last seen
                              timestamps. Your Discord avatar, banner, and
                              username changes will automatically sync with your
                              profile.
                            </p>
                          </div>
                        ) : (
                          user.last_seen && (
                            <p className="text-secondary-text text-sm">
                              Last seen:{" "}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="cursor-help"
                                    aria-label={`User was last seen ${lastSeenTime}`}
                                  >
                                    {lastSeenTime}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {formatCustomDate(user.last_seen)}
                                </TooltipContent>
                              </Tooltip>
                            </p>
                          )
                        )}
                      </>
                    )}

                    {isLoadingAdditionalData ? (
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={20}
                        sx={{ mb: 1 }}
                      />
                    ) : (
                      user.created_at && (
                        <p className="text-secondary-text mb-1 text-base">
                          <span className="text-primary-text">Member</span> #
                          {user.usernumber}{" "}
                          <span className="text-primary-text">since</span>{" "}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {formatShortDate(user.created_at)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {formatCustomDate(
                                parseInt(user.created_at) * 1000,
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </p>
                      )
                    )}

                    {/* Follower/Following Counts */}
                    <div className="mt-2 flex items-center justify-center space-x-4 md:justify-start">
                      {isLoadingAdditionalData ? (
                        <>
                          <Skeleton variant="text" width={80} height={20} />
                          <Skeleton variant="text" width={80} height={20} />
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              followerCount > 0 && setIsFollowersModalOpen(true)
                            }
                            className={`text-primary-text text-base ${followerCount > 0 ? "hover:text-border-focus cursor-pointer transition-colors" : "cursor-default"}`}
                          >
                            <span className="font-semibold">
                              {followerCount}
                            </span>{" "}
                            {followerCount === 1 ? "follower" : "followers"}
                          </button>
                          <button
                            onClick={() =>
                              followingCount > 0 &&
                              setIsFollowingModalOpen(true)
                            }
                            className={`text-primary-text text-base ${followingCount > 0 ? "hover:text-border-focus cursor-pointer transition-colors" : "cursor-default"}`}
                          >
                            <span className="font-semibold">
                              {followingCount}
                            </span>{" "}
                            following
                          </button>
                        </>
                      )}
                    </div>

                    {/* Connection Icons */}
                    <div className="mt-2 mb-5 flex flex-wrap items-center justify-center gap-2 md:mb-0 md:justify-start">
                      {isLoadingAdditionalData ? (
                        <>
                          <Skeleton variant="rounded" width={100} height={32} />
                          <Skeleton variant="rounded" width={100} height={32} />
                        </>
                      ) : (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`https://discord.com/users/${user.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-80"
                              >
                                <DiscordIcon className="text-border-focus h-3.5 w-3.5 shrink-0" />
                                <span className="text-sm font-semibold">
                                  Discord
                                </span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              Visit Discord Profile
                            </TooltipContent>
                          </Tooltip>

                          {user.roblox_id && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-80"
                                >
                                  <RobloxIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="text-sm font-semibold">
                                    Roblox
                                  </span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                Visit Roblox Profile
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-1 flex justify-center md:mt-0 md:self-start">
                    {currentUserId === user.id ? (
                      <Button asChild variant="default" size="md">
                        <Link href="/settings">
                          <Icon
                            icon="material-symbols:settings"
                            className="h-5 w-5"
                          />
                          Settings
                        </Link>
                      </Button>
                    ) : isAuthenticatedUser && currentUserId ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant={isFollowing ? "secondary" : "default"}
                              onClick={handleFollow}
                              disabled={isLoadingFollow}
                              size="md"
                            >
                              <Icon
                                icon={
                                  isFollowing
                                    ? "heroicons:user-minus"
                                    : "heroicons:user-plus"
                                }
                                className="h-5 w-5"
                              />
                              {isFollowing ? "Unfollow" : "Follow"}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isFollowing
                            ? "Unfollow this user"
                            : "Follow this user"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="default"
                              size="md"
                              onClick={() =>
                                toast.error(
                                  "You need to be logged in to follow users",
                                )
                              }
                            >
                              <Icon
                                icon="heroicons:user-plus"
                                className="h-5 w-5"
                              />
                              Follow
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          You need to be logged in to follow users
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 md:mt-6">
            <ProfileTabs
              user={user}
              currentUserId={currentUserId}
              bio={bio}
              bioLastUpdated={bioLastUpdated}
              comments={comments}
              commentsLoading={isLoadingAdditionalData || commentsLoading}
              commentsError={additionalDataError || commentsError}
              onBioUpdate={refreshBio}
              privateServers={privateServers}
              isLoadingAdditionalData={isLoadingAdditionalData}
              favorites={favorites}
              favoriteItemDetails={favoriteItemDetails}
              tradeAds={tradeAds}
            />
          </div>
        </div>
      </div>
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={user.id}
        isOwnProfile={user.id === currentUserId}
        currentUserId={currentUserId}
        onFollowChange={(type) => {
          if (type === "remove") {
            setFollowerCount((prev) => Math.max(0, prev - 1));
          } else if (type === "add") {
            setFollowingCount((prev) => prev + 1);
          }
        }}
        onCountUpdate={(count) => {
          setFollowerCount(count);
        }}
        userData={user}
      />
      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        userId={user.id}
        isOwnProfile={user.id === currentUserId}
        currentUserId={currentUserId}
        onFollowChange={(isFollowing) => {
          if (isFollowing) {
            setFollowingCount((prev) => prev + 1);
          } else {
            setFollowingCount((prev) => Math.max(0, prev - 1));
          }
        }}
        onCountUpdate={(count) => {
          setFollowingCount(count);
        }}
        userData={user}
      />
    </main>
  );
}
