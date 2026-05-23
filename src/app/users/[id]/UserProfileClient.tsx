"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NextError from "next/error";
import { notFound, useRouter } from "next/navigation";
import { UserAvatar } from "@/utils/ui/avatar";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Icon } from "../../../components/ui/IconWrapper";
import { Banner } from "@/components/Profile/Banner";
import { UserSettingsV2, FollowingData } from "@/types/auth";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";

import { UserBadges } from "@/components/Profile/UserBadges";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { convertUrlsToLinks } from "@/utils/ui/urlConverter";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { formatShortDate, formatCustomDate } from "@/utils/helpers/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import ProfileTabs from "@/components/Profile/ProfileTabs";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import type { TradeAd } from "@/types/trading";
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

const log = createLogger("UI");

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
  settings_v2?: UserSettingsV2;
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

interface UserProfileData {
  user: User;
  followerCount: number;
  followingCount: number;
  bio: string | null;
  bioLastUpdated: number | null;
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

function accentToPageBg(hex: string, mode: "light" | "dark"): string {
  if (!hex || hex.length < 6) return mode === "light" ? "#c4b5fd" : "#1a1530";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const sat = Math.round(Math.min(s * 100, 60));
  return mode === "light" ? `hsl(${h}, ${sat}%, 88%)` : `hsl(${h}, 30%, 11%)`;
}

export default function UserProfileClient({
  userId,
  initialData,
  error,
  isLoadingAdditionalData = false,
  additionalDataError: _additionalDataError,
}: UserProfileClientProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user: currentUser, isLoading: authLoading } = useAuthContext();
  const [user, setUser] = useState<User | null>(initialData?.user || null);
  const [loading] = useState(!initialData && !error);
  const [errorState] = useState<string | null>(error?.message || null);
  const [errorCode] = useState<number | null>(error?.code || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(true);
  const [followerCount, setFollowerCount] = useState(
    initialData?.followerCount || 0,
  );
  const [followingCount, setFollowingCount] = useState(
    initialData?.followingCount || 0,
  );
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [canMessageFromProfile, setCanMessageFromProfile] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockingAction, setIsBlockingAction] = useState(false);
  const [bio, setBio] = useState<string | null>(initialData?.bio || null);
  const [bioLastUpdated, setBioLastUpdated] = useState<number | null>(
    initialData?.bioLastUpdated || null,
  );
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
  const [isReportDescriptionOpen, setIsReportDescriptionOpen] = useState(false);
  const [reportDescriptionReason, setReportDescriptionReason] = useState("");
  const [isSubmittingDescriptionReport, setIsSubmittingDescriptionReport] =
    useState(false);
  const [isReportAvatarOpen, setIsReportAvatarOpen] = useState(false);
  const [reportAvatarReason, setReportAvatarReason] = useState("");
  const [isSubmittingAvatarReport, setIsSubmittingAvatarReport] =
    useState(false);
  const [isReportBannerOpen, setIsReportBannerOpen] = useState(false);
  const [reportBannerReason, setReportBannerReason] = useState("");
  const [isSubmittingBannerReport, setIsSubmittingBannerReport] =
    useState(false);
  const [isReportUsernameOpen, setIsReportUsernameOpen] = useState(false);
  const [reportUsernameReason, setReportUsernameReason] = useState("");
  const [isSubmittingUsernameReport, setIsSubmittingUsernameReport] =
    useState(false);

  const parseJsonWithLargeIds = (raw: string): unknown =>
    JSON.parse(
      raw.replace(
        /"(id|user_id|blocked_user_id)"\s*:\s*(\d{16,})/g,
        '"$1":"$2"',
      ),
    );

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

  // Owner viewing their own private profile — resolve client-side instead of server-side
  useEffect(() => {
    if (
      error?.message?.startsWith("PRIVATE_PROFILE:") &&
      error?.code === 403 &&
      currentUser?.id === userId
    ) {
      setUser({
        ...currentUser,
        banner: currentUser.banner ?? undefined,
        custom_banner: currentUser.custom_banner ?? undefined,
      });
    }
  }, [currentUser, error, userId]);

  // Update following status when currentUserId changes
  useEffect(() => {
    const updateFollowingStatus = async () => {
      if (currentUserId && user && userId) {
        setIsLoadingFollow(true);
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
          log.error("Error fetching following status:", error);
        } finally {
          setIsLoadingFollow(false);
        }
      }
    };

    updateFollowingStatus();
  }, [currentUserId, userId, user]);

  useEffect(() => {
    if (
      !isAuthenticatedUser ||
      !currentUserId ||
      !user ||
      currentUserId === user.id
    ) {
      setIsBlockedByMe(false);
      return;
    }

    let isCancelled = false;

    const fetchBlockedStatus = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Public API URL is not configured");
        }

        const { url: blockedUrl, headers: devTokenHeaders } =
          buildApiFetchRequest(PUBLIC_API_URL, "/messages/blocked");
        const response = await fetch(blockedUrl, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: devTokenHeaders,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          log.error("fetch blocked users failed", {
            status: response.status,
            body,
          });
          throw new Error("Failed to fetch blocked users");
        }

        const rawBody = await response.text();
        const parsed = rawBody ? parseJsonWithLargeIds(rawBody) : null;
        const blockedUsers = Array.isArray(
          (parsed as { blocked_users?: unknown[] } | null)?.blocked_users,
        )
          ? ((parsed as { blocked_users: unknown[] }).blocked_users ?? [])
          : [];

        const isBlocked = blockedUsers.some((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const blockedUserId = (entry as Record<string, unknown>)
            .blocked_user_id;
          return String(blockedUserId) === user.id;
        });

        if (!isCancelled) {
          setIsBlockedByMe(isBlocked);
        }
      } catch (error) {
        if (!isCancelled) {
          log.error("Error fetching blocked status:", error);
          setIsBlockedByMe(false);
        }
      }
    };

    void fetchBlockedStatus();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, isAuthenticatedUser, user]);

  useEffect(() => {
    if (
      !isAuthenticatedUser ||
      !currentUserId ||
      !user ||
      currentUserId === user.id
    ) {
      setCanMessageFromProfile(true);
      return;
    }

    let isCancelled = false;
    setCanMessageFromProfile(false);

    const checkCanMessage = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Public API URL is not configured");
        }

        const { url: messageCheckUrl, headers: devTokenHeaders } =
          buildApiFetchRequest(
            PUBLIC_API_URL,
            `/messages/${encodeURIComponent(user.id)}`,
          );
        const response = await fetch(messageCheckUrl, {
          method: "HEAD",
          credentials: "include",
          cache: "no-store",
          headers: devTokenHeaders,
        });

        if (isCancelled) return;
        setCanMessageFromProfile(response.status === 200);
      } catch (error) {
        if (isCancelled) return;
        log.error("Error checking profile messaging permission:", error);
        // Fallback: keep message button visible unless backend explicitly forbids.
        setCanMessageFromProfile(true);
      }
    };

    void checkCanMessage();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, isAuthenticatedUser, isBlockedByMe, user]);

  const isOwner =
    user?.flags?.some((f) => f.flag === "is_owner" && f.enabled !== false) ??
    false;

  useEffect(() => {
    if (isOwner && user?.accent_color) {
      document.body.style.backgroundColor = accentToPageBg(
        user.accent_color,
        resolvedTheme,
      );
    } else {
      document.body.style.backgroundColor = "";
    }
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [isOwner, resolvedTheme, user?.accent_color]);

  const handleBlockToggle = async () => {
    if (
      !isAuthenticatedUser ||
      !currentUserId ||
      !user ||
      currentUserId === user.id
    ) {
      return;
    }

    const shouldBlock = !isBlockedByMe;
    const loadingMessage = shouldBlock
      ? "Blocking user..."
      : "Unblocking user...";
    const successMessage = shouldBlock ? "User blocked" : "User unblocked";
    const fallbackErrorMessage = shouldBlock
      ? "Failed to block user"
      : "Failed to unblock user";
    const toastId = `profile-block-action:${user.id}`;

    try {
      setIsBlockingAction(true);
      toast.loading(loadingMessage, { id: toastId });
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const { url: blockUrl, headers: devTokenHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(user.id)}/block`,
      );
      const response = await fetch(blockUrl, {
        method: shouldBlock ? "POST" : "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: devTokenHeaders,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("block/unblock user failed", {
          status: response.status,
          body,
        });
        throw new Error(fallbackErrorMessage);
      }

      setIsBlockedByMe((prev) => !prev);
      toast.success(successMessage, { id: toastId });
    } catch (error) {
      log.error("Error toggling blocked status:", error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : fallbackErrorMessage,
        { id: toastId },
      );
    } finally {
      setIsBlockingAction(false);
    }
  };

  const handleReportDescription = async () => {
    if (!user || !reportDescriptionReason.trim()) return;

    setIsSubmittingDescriptionReport(true);
    const toastId = toast.loading("Submitting report...");
    try {
      const { url: reportDescUrl, headers: devTokenHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL, "/users/description/report");
      const response = await fetch(reportDescUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          reason: reportDescriptionReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setIsReportDescriptionOpen(false);
      setReportDescriptionReason("");
    } catch (error) {
      log.error("Error reporting description:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
    } finally {
      setIsSubmittingDescriptionReport(false);
    }
  };

  const handleReportAvatar = async () => {
    if (!user || !reportAvatarReason.trim()) return;

    setIsSubmittingAvatarReport(true);
    const toastId = toast.loading("Submitting report...");
    try {
      const { url: reportAvatarUrl, headers: devTokenHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL, "/users/avatar/report");
      const response = await fetch(reportAvatarUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          reason: reportAvatarReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setIsReportAvatarOpen(false);
      setReportAvatarReason("");
    } catch (error) {
      log.error("Error reporting avatar:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
    } finally {
      setIsSubmittingAvatarReport(false);
    }
  };

  const handleReportBanner = async () => {
    if (!user || !reportBannerReason.trim()) return;

    setIsSubmittingBannerReport(true);
    const toastId = toast.loading("Submitting report...");
    try {
      const { url: reportBannerUrl, headers: devTokenHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL, "/users/banner/report");
      const response = await fetch(reportBannerUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          reason: reportBannerReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setIsReportBannerOpen(false);
      setReportBannerReason("");
    } catch (error) {
      log.error("Error reporting banner:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
    } finally {
      setIsSubmittingBannerReport(false);
    }
  };

  const handleReportUsername = async () => {
    if (!user || !reportUsernameReason.trim()) return;

    setIsSubmittingUsernameReport(true);
    const toastId = toast.loading("Submitting report...");
    try {
      const { url: reportUsernameUrl, headers: devTokenHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL, "/users/username/report");
      const response = await fetch(reportUsernameUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          reason: reportUsernameReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setIsReportUsernameOpen(false);
      setReportUsernameReason("");
    } catch (error) {
      log.error("Error reporting username:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
    } finally {
      setIsSubmittingUsernameReport(false);
    }
  };

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
        const body = await response.json().catch(() => ({}));
        const errorMessage = isFollowing
          ? "Failed to unfollow user"
          : "Failed to follow user";
        log.error(errorMessage, { status: response.status, body });
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

      window.rybbit?.event(isFollowing ? "Unfollow User" : "Follow User", {
        location: "User Profile",
      });
    } catch (error) {
      log.error("Error updating follow status:", error);
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
            <Skeleton className="rounded-none" style={{ height: 256 }} />

            {/* Profile Content skeleton */}
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-6">
                {/* Avatar skeleton */}
                <div className="relative -mt-16 md:-mt-24">
                  <Skeleton
                    className="rounded-full"
                    style={{ width: 96, height: 96 }}
                  />
                </div>

                <div className="w-full flex-1 text-center md:text-left">
                  <div className="flex flex-col items-center justify-between md:flex-row md:items-start">
                    <div>
                      {/* Username skeleton */}
                      <Skeleton style={{ width: 160, height: 28 }} />
                      {/* Handle skeleton */}
                      <Skeleton style={{ width: 128, height: 16 }} />
                      {/* Last seen skeleton */}
                      <Skeleton style={{ width: 192, height: 12 }} />
                      {/* Member since skeleton */}
                      <Skeleton style={{ width: 224, height: 12 }} />

                      {/* Follower/Following skeleton */}
                      <div className="mt-2 flex items-center justify-center space-x-4 md:justify-start">
                        <Skeleton style={{ width: 80, height: 16 }} />
                        <Skeleton style={{ width: 80, height: 16 }} />
                      </div>

                      {/* Connection icons skeleton */}
                      <div className="mt-2 flex items-center justify-center space-x-3 md:justify-start">
                        <Skeleton
                          className="rounded-full"
                          style={{ width: 20, height: 20 }}
                        />
                        <Skeleton
                          className="rounded-full"
                          style={{ width: 20, height: 20 }}
                        />
                      </div>
                    </div>

                    {/* Button skeleton */}
                    <Skeleton style={{ width: 112, height: 40 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs skeleton */}
            <div className="mt-2 md:mt-6">
              <div className="border-b">
                <div className="flex gap-4 overflow-x-auto p-2">
                  <Skeleton style={{ width: 80, height: 32 }} />
                  <Skeleton style={{ width: 80, height: 32 }} />
                  <Skeleton style={{ width: 80, height: 32 }} />
                  <Skeleton style={{ width: 80, height: 32 }} />
                </div>
              </div>
              <div className="p-3 sm:p-4">
                {/* Tab content skeleton */}
                <div className="space-y-4">
                  <Skeleton style={{ height: 80 }} />
                  <Skeleton style={{ height: 80 }} />
                  <Skeleton style={{ height: 80 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (errorCode && !user) {
    if (authLoading) return null;
    const hasPrivateProfilePrefix =
      !!errorState && errorState.startsWith("PRIVATE_PROFILE:");
    const isPrivateProfileError =
      errorCode === 403 &&
      (hasPrivateProfilePrefix ||
        (!!errorState &&
          errorState.toLowerCase().includes("profile is private")));
    const privateProfileMessage = hasPrivateProfilePrefix
      ? errorState.replace("PRIVATE_PROFILE:", "").trim()
      : errorState;

    // Render dedicated private-profile UI for private profile errors.
    if (isPrivateProfileError) {
      return (
        <main className="min-h-screen pb-8">
          <div className="container mx-auto max-w-7xl">
            <Breadcrumb />
            <div className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border shadow-md">
              <div className="flex min-h-[65vh] items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
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
                      {privateProfileMessage ||
                        "This user has chosen to keep their profile private"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      );
    }

    // Handle 403 and 404 errors by calling notFound() to trigger the custom not-found page
    if (errorCode === 403 || errorCode === 404) {
      notFound();
    }

    return <NextError statusCode={errorCode} title={errorState || undefined} />;
  }

  if (!user) {
    notFound();
  }

  if (user.settings_v2?.profile_public === false && currentUserId !== user.id) {
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
                    settings={user.settings_v2}
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
            settings={user.settings_v2}
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
                    user.settings_v2?.hide_presence === true &&
                    currentUserId !== user.id
                      ? false
                      : user.presence?.status === "Online"
                  }
                  showBadge={true}
                  settings={user.settings_v2}
                  premiumType={user.premiumtype}
                />
              </div>
              <div className="w-full flex-1">
                <div className="flex flex-col justify-between md:flex-row">
                  <div className="w-full text-center md:w-auto md:text-left">
                    <div className="flex max-w-full flex-col items-center justify-center gap-2 md:flex-row md:flex-wrap md:justify-start">
                      <h1 className="text-primary-text mb-1 max-w-70 truncate text-2xl font-bold md:text-3xl lg:max-w-none">
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
                    <p className="text-secondary-text mx-auto mb-1 max-w-70 truncate text-lg md:mx-0 lg:max-w-none">
                      @{user.username}
                    </p>

                    {isLoadingAdditionalData ? (
                      <Skeleton className="w-3/5" style={{ height: 16 }} />
                    ) : (
                      <>
                        {user.settings_v2?.hide_presence === true &&
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
                          <div className="bg-tertiary-bg mt-2 mb-2 rounded-lg p-4">
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
                      <Skeleton className="w-4/5" style={{ height: 20 }} />
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
                          <Skeleton style={{ width: 80, height: 20 }} />
                          <Skeleton style={{ width: 80, height: 20 }} />
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
                          <Skeleton style={{ width: 100, height: 32 }} />
                          <Skeleton style={{ width: 100, height: 32 }} />
                        </>
                      ) : (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`https://discord.com/users/${user.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-text bg-tertiary-bg border-border-card hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all"
                              >
                                <DiscordIcon className="h-3.5 w-3.5" />
                                Discord
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
                                  className="text-primary-text bg-tertiary-bg border-border-card hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all"
                                >
                                  <RobloxIcon className="h-3.5 w-3.5" />
                                  Roblox
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
                  <div className="mt-1 flex justify-center gap-2 md:mt-0 md:self-start">
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
                      <>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              disabled={isBlockingAction}
                            >
                              <Icon
                                icon="heroicons:ellipsis-horizontal"
                                className="h-5 w-5"
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-0">
                            {canMessageFromProfile && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/messages/${encodeURIComponent(user.id)}`,
                                  )
                                }
                                className="rounded-none px-3 py-2"
                              >
                                <Icon
                                  icon="heroicons:chat-bubble-left-right"
                                  className="mr-2 h-4 w-4"
                                />
                                Message
                              </DropdownMenuItem>
                            )}
                            {/* Mobile (< sm): flat items — alphabetical */}
                            <DropdownMenuItem
                              onClick={() => {
                                setIsReportAvatarOpen(true);
                                setReportAvatarReason("");
                              }}
                              className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2 sm:hidden"
                            >
                              <Icon
                                icon="heroicons:flag"
                                className="mr-2 h-4 w-4"
                              />
                              Report Avatar
                            </DropdownMenuItem>
                            {(user.banner ?? user.custom_banner) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setIsReportBannerOpen(true);
                                  setReportBannerReason("");
                                }}
                                className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2 sm:hidden"
                              >
                                <Icon
                                  icon="heroicons:flag"
                                  className="mr-2 h-4 w-4"
                                />
                                Report Banner
                              </DropdownMenuItem>
                            )}
                            {bio && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setIsReportDescriptionOpen(true);
                                  setReportDescriptionReason("");
                                }}
                                className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2 sm:hidden"
                              >
                                <Icon
                                  icon="heroicons:flag"
                                  className="mr-2 h-4 w-4"
                                />
                                Report Description
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setIsReportUsernameOpen(true);
                                setReportUsernameReason("");
                              }}
                              className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2 sm:hidden"
                            >
                              <Icon
                                icon="heroicons:flag"
                                className="mr-2 h-4 w-4"
                              />
                              Report Username
                            </DropdownMenuItem>
                            {/* Desktop (≥ sm): nested submenu — alphabetical */}
                            <div className="hidden sm:contents">
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger data-[state=open]:bg-button-danger/10 data-[state=open]:text-button-danger rounded-none px-3 py-2">
                                  <Icon
                                    icon="heroicons:flag"
                                    className="mr-2 h-4 w-4"
                                  />
                                  Report
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="p-0">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setIsReportAvatarOpen(true);
                                      setReportAvatarReason("");
                                    }}
                                    className="rounded-none px-3 py-2"
                                  >
                                    <Icon
                                      icon="heroicons:user-circle"
                                      className="mr-2 h-4 w-4"
                                    />
                                    Avatar
                                  </DropdownMenuItem>
                                  {(user.banner ?? user.custom_banner) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setIsReportBannerOpen(true);
                                        setReportBannerReason("");
                                      }}
                                      className="rounded-none px-3 py-2"
                                    >
                                      <Icon
                                        icon="heroicons:photo"
                                        className="mr-2 h-4 w-4"
                                      />
                                      Banner
                                    </DropdownMenuItem>
                                  )}
                                  {bio && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setIsReportDescriptionOpen(true);
                                        setReportDescriptionReason("");
                                      }}
                                      className="rounded-none px-3 py-2"
                                    >
                                      <Icon
                                        icon="heroicons:document-text"
                                        className="mr-2 h-4 w-4"
                                      />
                                      Description
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setIsReportUsernameOpen(true);
                                      setReportUsernameReason("");
                                    }}
                                    className="rounded-none px-3 py-2"
                                  >
                                    <Icon
                                      icon="heroicons:at-symbol"
                                      className="mr-2 h-4 w-4"
                                    />
                                    Username
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </div>
                            <DropdownMenuSeparator className="my-0" />
                            <DropdownMenuItem
                              onClick={() => void handleBlockToggle()}
                              disabled={isBlockingAction}
                              className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2"
                            >
                              <Icon
                                icon={
                                  isBlockedByMe
                                    ? "heroicons:lock-open"
                                    : "heroicons:no-symbol"
                                }
                                className="mr-2 h-4 w-4"
                              />
                              {isBlockedByMe ? "Unblock User" : "Block User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="default"
                                size="md"
                                disabled={true}
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
                      </>
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
      <ConfirmDialog
        isOpen={isReportDescriptionOpen}
        onClose={() => {
          setIsReportDescriptionOpen(false);
          setReportDescriptionReason("");
        }}
        onConfirm={() => void handleReportDescription()}
        title="Report Description"
        confirmText="Submit Report"
        confirmVariant="destructive"
        confirmDisabled={
          !reportDescriptionReason.trim() || isSubmittingDescriptionReport
        }
        closeOnConfirm={false}
      >
        <div className="space-y-3">
          {bio && (
            <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <UserAvatar
                    userId={user.id}
                    avatarHash={user.avatar}
                    username={user.username}
                    custom_avatar={user.custom_avatar}
                    size={7}
                    showBadge={false}
                    settings={user.settings_v2}
                    premiumType={user.premiumtype}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-primary-text text-sm font-medium">
                    {user.global_name && user.global_name !== "None"
                      ? user.global_name
                      : user.username}
                  </span>
                  <p className="text-primary-text/80 mt-0.5 line-clamp-4 text-sm break-words whitespace-pre-wrap">
                    {convertUrlsToLinks(sanitizeText(bio))}
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-secondary-text text-sm">
            Please describe why you are reporting this description.
          </p>
          <div>
            <textarea
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              placeholder="Explain why you're reporting this description..."
              value={reportDescriptionReason}
              onChange={(e) => setReportDescriptionReason(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reportDescriptionReason.length >= 500 ? "text-red-500" : "text-secondary-text"}`}
            >
              {reportDescriptionReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={isReportAvatarOpen}
        onClose={() => {
          setIsReportAvatarOpen(false);
          setReportAvatarReason("");
        }}
        onConfirm={() => void handleReportAvatar()}
        title="Report Avatar"
        confirmText="Submit Report"
        confirmVariant="destructive"
        confirmDisabled={!reportAvatarReason.trim() || isSubmittingAvatarReport}
        closeOnConfirm={false}
      >
        <div className="space-y-3">
          <div className="border-border-card bg-tertiary-bg/50 flex items-center gap-3 rounded-lg border p-3">
            <UserAvatar
              userId={user.id}
              avatarHash={user.avatar}
              username={user.username}
              custom_avatar={user.custom_avatar}
              size={16}
              showBadge={false}
              settings={user.settings_v2}
              premiumType={user.premiumtype}
            />
            <span className="text-primary-text text-sm font-medium">
              {user.global_name && user.global_name !== "None"
                ? user.global_name
                : user.username}
            </span>
          </div>
          <p className="text-secondary-text text-sm">
            Please describe why you are reporting this avatar.
          </p>
          <div>
            <textarea
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              placeholder="Explain why you're reporting this avatar..."
              value={reportAvatarReason}
              onChange={(e) => setReportAvatarReason(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reportAvatarReason.length >= 500 ? "text-red-500" : "text-secondary-text"}`}
            >
              {reportAvatarReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={isReportBannerOpen}
        onClose={() => {
          setIsReportBannerOpen(false);
          setReportBannerReason("");
        }}
        onConfirm={() => void handleReportBanner()}
        title="Report Banner"
        confirmText="Submit Report"
        confirmVariant="destructive"
        confirmDisabled={!reportBannerReason.trim() || isSubmittingBannerReport}
        closeOnConfirm={false}
      >
        <div className="space-y-3">
          <div className="border-border-card bg-tertiary-bg/50 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                user.settings_v2?.custom_banner === true &&
                user.premiumtype &&
                user.premiumtype >= 2 &&
                user.custom_banner &&
                user.custom_banner !== "N/A"
                  ? user.custom_banner
                  : user.banner && user.banner !== "None"
                    ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}?size=512`
                    : undefined
              }
              alt={`${user.username}'s banner`}
              className="object-contain"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <p className="text-secondary-text text-sm">
            Please describe why you are reporting this banner.
          </p>
          <div>
            <textarea
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              placeholder="Explain why you're reporting this banner..."
              value={reportBannerReason}
              onChange={(e) => setReportBannerReason(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reportBannerReason.length >= 500 ? "text-red-500" : "text-secondary-text"}`}
            >
              {reportBannerReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={isReportUsernameOpen}
        onClose={() => {
          setIsReportUsernameOpen(false);
          setReportUsernameReason("");
        }}
        onConfirm={() => void handleReportUsername()}
        title="Report Username"
        confirmText="Submit Report"
        confirmVariant="destructive"
        confirmDisabled={
          !reportUsernameReason.trim() || isSubmittingUsernameReport
        }
        closeOnConfirm={false}
      >
        <div className="space-y-3">
          <div className="border-border-card bg-tertiary-bg/50 flex items-center gap-3 rounded-lg border p-3">
            <UserAvatar
              userId={user.id}
              avatarHash={user.avatar}
              username={user.username}
              custom_avatar={user.custom_avatar}
              size={7}
              showBadge={false}
              settings={user.settings_v2}
              premiumType={user.premiumtype}
            />
            <div>
              <p className="text-primary-text text-sm font-medium">
                {user.global_name && user.global_name !== "None"
                  ? user.global_name
                  : user.username}
              </p>
              <p className="text-secondary-text text-xs">@{user.username}</p>
            </div>
          </div>
          <p className="text-secondary-text text-sm">
            Please describe why you are reporting this username.
          </p>
          <div>
            <textarea
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              placeholder="Explain why you're reporting this username..."
              value={reportUsernameReason}
              onChange={(e) => setReportUsernameReason(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reportUsernameReason.length >= 500 ? "text-red-500" : "text-secondary-text"}`}
            >
              {reportUsernameReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>
    </main>
  );
}
