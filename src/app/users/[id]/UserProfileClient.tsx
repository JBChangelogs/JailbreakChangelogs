"use client";

import { accentCardTheme, accentColorToHex } from "@/utils/ui/accentColor";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import NextError from "next/error";
import { notFound } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { UserAvatar } from "@/utils/ui/avatar";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Icon } from "../../../components/ui/IconWrapper";
import { Banner } from "@/components/Profile/Banner";
import { ProfileBackground } from "@/components/Profile/ProfileBackground";
import { UserSettingsV2, FollowingData } from "@/types/auth";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import {
  AvatarEditOverlay,
  BannerEditOverlay,
} from "@/components/Profile/EditableProfileImages";
import { safeSetJSON } from "@/utils/storage/safeStorage";
import { cn } from "@/lib/utils";

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
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import ProfileOverview from "@/components/Profile/ProfileOverview";
import ProfileIdentityBar from "@/components/Profile/ProfileIdentityBar";
import { useAuthContext } from "@/contexts/AuthContext";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { profileSocialQueryOptions } from "@/utils/api/profileSocialQueries";
import type { ProfileDataResult } from "@/services/profileDataService";
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

interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_accent_color?: string | null;
  custom_avatar?: string;
  banner?: string;
  custom_banner?: string;
  /** Profile background image URL (16:9, may be an animated GIF), or null. */
  custom_background?: string | null;
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

export interface UserProfileData extends ProfileDataResult {
  user: User;
}

interface UserProfileClientProps {
  userId: string;
  profileData?: UserProfileData;
  onProfileDataChange: (
    update: (data: UserProfileData) => UserProfileData,
  ) => void;
  error?: { message: string; code: number };
}

export default function UserProfileClient({
  userId,
  profileData,
  onProfileDataChange,
  error,
}: UserProfileClientProps) {
  const queryClient = useQueryClient();
  const profileIdentityRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuthContext();
  const user = profileData?.user ?? null;
  const profileUserId = user?.id;
  const errorState = error?.message ?? null;
  const errorCode = error?.code ?? null;
  const currentUserId = currentUser?.id ?? null;
  const isAuthenticatedUser = Boolean(currentUser);
  const followerCount = profileData?.followerCount ?? 0;
  const followingCount = profileData?.followingCount ?? 0;
  const bio = profileData?.bio ?? null;
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [canMessageFromProfile, setCanMessageFromProfile] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockingAction, setIsBlockingAction] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isReportDescriptionOpen, setIsReportDescriptionOpen] = useState(false);
  const [reportDescriptionReason, setReportDescriptionReason] = useState("");
  const [isSubmittingDescriptionReport, setIsSubmittingDescriptionReport] =
    useState(false);
  const [isReportAvatarOpen, setIsReportAvatarOpen] = useState(false);
  const [reportAvatarReason, setReportAvatarReason] = useState("");
  const [isSubmittingAvatarReport, setIsSubmittingAvatarReport] =
    useState(false);
  // Banner and background reports share one dialog; this holds which is open.
  const [reportImageTarget, setReportImageTarget] = useState<
    "banner" | "background" | null
  >(null);
  const [reportBannerReason, setReportBannerReason] = useState("");
  const [isSubmittingBannerReport, setIsSubmittingBannerReport] =
    useState(false);
  const [isReportUsernameOpen, setIsReportUsernameOpen] = useState(false);
  const [reportUsernameReason, setReportUsernameReason] = useState("");
  const [isSubmittingUsernameReport, setIsSubmittingUsernameReport] =
    useState(false);
  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [reportUserReason, setReportUserReason] = useState("");
  const [isSubmittingUserReport, setIsSubmittingUserReport] = useState(false);

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

  const refreshBio = (newBio: string) => {
    onProfileDataChange((data) => ({
      ...data,
      bio: newBio,
      bioLastUpdated: Date.now(),
    }));
  };

  const updateUser = (update: (previousUser: User) => User) => {
    onProfileDataChange((data) => ({ ...data, user: update(data.user) }));
  };

  const handleProfileAvatarUploaded = (
    newAvatarUrl: string,
    displayEnabled: boolean,
  ) => {
    updateUser((previousUser) => ({
      ...previousUser,
      avatar: displayEnabled ? newAvatarUrl : previousUser.avatar,
      custom_avatar: newAvatarUrl,
      settings_v2: previousUser.settings_v2
        ? {
            ...previousUser.settings_v2,
            custom_avatar: displayEnabled,
          }
        : previousUser.settings_v2,
    }));

    if (currentUser) {
      const updatedCurrentUser = {
        ...currentUser,
        avatar: displayEnabled ? newAvatarUrl : currentUser.avatar,
        custom_avatar: newAvatarUrl,
        settings_v2: {
          ...currentUser.settings_v2,
          custom_avatar: displayEnabled,
        } as UserSettingsV2,
      };
      safeSetJSON("user", updatedCurrentUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedCurrentUser }),
      );
    }
  };

  const handleProfileBannerUploaded = (
    newBannerUrl: string,
    displayEnabled: boolean,
  ) => {
    updateUser((previousUser) => ({
      ...previousUser,
      banner: displayEnabled ? newBannerUrl : previousUser.banner,
      custom_banner: newBannerUrl,
      settings_v2: previousUser.settings_v2
        ? {
            ...previousUser.settings_v2,
            custom_banner: displayEnabled,
          }
        : previousUser.settings_v2,
    }));

    if (currentUser) {
      const updatedCurrentUser = {
        ...currentUser,
        banner: displayEnabled ? newBannerUrl : currentUser.banner,
        custom_banner: newBannerUrl,
        settings_v2: {
          ...currentUser.settings_v2,
          custom_banner: displayEnabled,
        } as UserSettingsV2,
      };
      safeSetJSON("user", updatedCurrentUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedCurrentUser }),
      );
    }
  };

  const followingQuery = useQuery({
    ...profileSocialQueryOptions(
      "following",
      currentUserId ?? "",
      currentUserId,
    ),
    enabled: Boolean(currentUserId && user),
  });
  const isFollowing =
    followingQuery.data?.some(
      (followedUser) =>
        followedUser.user_id === currentUserId &&
        followedUser.following_id === userId,
    ) ?? false;
  const isLoadingFollow = isUpdatingFollow || followingQuery.isLoading;

  useEffect(() => {
    if (
      !isAuthenticatedUser ||
      !currentUserId ||
      !profileUserId ||
      currentUserId === profileUserId
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

        const parsed = await queryClient.fetchQuery({
          queryKey: ["blocked-users", currentUserId],
          queryFn: async ({ signal }) => {
            const { url, headers } = buildApiFetchRequest(
              PUBLIC_API_URL,
              "/v2/users/me/blocked-users",
            );
            const response = await fetch(url, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers,
              signal,
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
            return rawBody ? parseJsonWithLargeIds(rawBody) : null;
          },
          staleTime: 0,
          gcTime: 0,
          retry: false,
        });
        const blockedUsers = Array.isArray(
          (parsed as { blocked_users?: unknown[] } | null)?.blocked_users,
        )
          ? ((parsed as { blocked_users: unknown[] }).blocked_users ?? [])
          : [];

        const isBlocked = blockedUsers.some((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const blockedUserId = (entry as Record<string, unknown>)
            .blocked_user_id;
          return String(blockedUserId) === profileUserId;
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
  }, [currentUserId, isAuthenticatedUser, profileUserId, queryClient]);

  useEffect(() => {
    if (
      !isAuthenticatedUser ||
      !currentUserId ||
      !profileUserId ||
      currentUserId === profileUserId
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

        const status = await queryClient.fetchQuery({
          queryKey: ["message-eligibility", currentUserId, profileUserId],
          queryFn: async ({ signal }) => {
            const { url, headers } = buildApiFetchRequest(
              PUBLIC_API_URL,
              `/v2/conversations/${encodeURIComponent(profileUserId)}`,
            );
            const response = await fetch(url, {
              method: "HEAD",
              credentials: "include",
              cache: "no-store",
              headers,
              signal,
            });
            return response.status;
          },
          staleTime: 0,
          gcTime: 0,
          retry: false,
        });

        if (isCancelled) return;
        setCanMessageFromProfile(status === 200);
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
  }, [
    currentUserId,
    isAuthenticatedUser,
    isBlockedByMe,
    profileUserId,
    queryClient,
  ]);

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
        `/v2/users/me/blocked-users/${encodeURIComponent(user.id)}`,
      );
      const response = await fetch(blockUrl, {
        method: shouldBlock ? "PUT" : "DELETE",
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
      void queryClient.invalidateQueries({
        queryKey: ["blocked-users", currentUserId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["message-eligibility", currentUserId, user.id],
      });
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
        buildApiFetchRequest(
          PUBLIC_API_URL,
          `/v2/users/${encodeURIComponent(user.id)}/reports`,
        );
      const response = await fetch(reportDescUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "description",
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
        buildApiFetchRequest(
          PUBLIC_API_URL,
          `/v2/users/${encodeURIComponent(user.id)}/reports`,
        );
      const response = await fetch(reportAvatarUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "avatar",
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
    if (!user || !reportImageTarget || !reportBannerReason.trim()) return;

    setIsSubmittingBannerReport(true);
    const toastId = toast.loading("Submitting report...");
    try {
      const { url: reportBannerUrl, headers: devTokenHeaders } =
        buildApiFetchRequest(
          PUBLIC_API_URL,
          `/v2/users/${encodeURIComponent(user.id)}/reports`,
        );
      const response = await fetch(reportBannerUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          target: reportImageTarget,
          reason: reportBannerReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setReportImageTarget(null);
      setReportBannerReason("");
    } catch (error) {
      log.error(`Error reporting ${reportImageTarget}:`, error);
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
        buildApiFetchRequest(
          PUBLIC_API_URL,
          `/v2/users/${encodeURIComponent(user.id)}/reports`,
        );
      const response = await fetch(reportUsernameUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "username",
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

  const handleReportUser = async () => {
    if (!user || !reportUserReason.trim()) return;

    setIsSubmittingUserReport(true);
    const toastId = toast.loading("Submitting report...");
    try {
      const { url: reportUserUrl, headers: devTokenHeaders } =
        buildApiFetchRequest(
          PUBLIC_API_URL,
          `/v2/users/${encodeURIComponent(user.id)}/reports`,
        );
      const response = await fetch(reportUserUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...devTokenHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "profile",
          reason: reportUserReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setIsReportUserOpen(false);
      setReportUserReason("");
    } catch (error) {
      log.error("Error reporting user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
    } finally {
      setIsSubmittingUserReport(false);
    }
  };

  const handleFollow = async () => {
    if (isLoadingFollow) return;

    setIsUpdatingFollow(true);
    try {
      if (!currentUserId) {
        toast.info("You need to be logged in to follow users");
        setIsUpdatingFollow(false);
        return;
      }

      const { url: followUrl, headers: followHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/me/following/${encodeURIComponent(userId)}`,
      );
      const response = await fetch(followUrl, {
        method: isFollowing ? "DELETE" : "PUT",
        credentials: "include",
        headers: followHeaders,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const errorMessage = isFollowing
          ? "Failed to unfollow user"
          : "Failed to follow user";
        log.error(errorMessage, { status: response.status, body });
        toast.error(errorMessage);
        return;
      }

      queryClient.setQueryData<FollowingData[]>(
        profileSocialQueryOptions("following", currentUserId, currentUserId)
          .queryKey,
        (data = []) =>
          isFollowing
            ? data.filter((entry) => entry.following_id !== userId)
            : [
                ...data,
                {
                  user_id: currentUserId,
                  following_id: userId,
                  created_at: new Date().toISOString(),
                  ...(user ? { user } : {}),
                },
              ],
      );
      void queryClient.invalidateQueries({
        queryKey: ["following", currentUserId],
      });
      void queryClient.invalidateQueries({ queryKey: ["followers", userId] });

      onProfileDataChange((data) => ({
        ...data,
        followerCount: Math.max(0, data.followerCount + (isFollowing ? -1 : 1)),
      }));

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
      setIsUpdatingFollow(false);
    }
  };

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

  const isOwnProfile = currentUserId === user.id;
  // Accent colors only recolor profile cards when the owner opts in.
  const accentColor =
    user.settings_v2?.colored_profile_cards === true
      ? (accentColorToHex(user.custom_accent_color) ??
        accentColorToHex(user.accent_color))
      : null;

  // Shown only when the owner switched it on; never gated on supporter tier.
  const hasVisibleBackground =
    user.settings_v2?.custom_background === true && !!user.custom_background;

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

  const profileActionButtonClassName =
    "md:h-10! md:gap-2! md:px-5! md:text-base! md:[&_svg]:size-5!";

  const profileConnections = (
    <>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <Link
            href={`https://discord.com/users/${user.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-text bg-tertiary-bg border-border-card hover:text-link-hover focus-visible:ring-border-focus inline-flex size-8 items-center justify-center rounded-lg border shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <DiscordIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Visit Discord profile</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Visit Discord Profile</TooltipContent>
      </Tooltip>

      {user.roblox_id && (
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <Link
              href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-text bg-tertiary-bg border-border-card hover:text-link-hover focus-visible:ring-border-focus inline-flex size-8 items-center justify-center rounded-lg border shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <RobloxIcon className="h-3.5 w-3.5" />
              <span className="sr-only">Visit Roblox profile</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Visit Roblox Profile</TooltipContent>
        </Tooltip>
      )}
    </>
  );

  return (
    <main
      className="relative isolate min-h-screen pb-8"
      data-accent-cards={accentColor ? "" : undefined}
      style={accentColor ? accentCardTheme(accentColor) : undefined}
    >
      {hasVisibleBackground && user.custom_background && (
        <ProfileBackground src={user.custom_background} />
      )}
      <LinSuperIdol userId={userId} />
      <div className="container mx-auto max-w-7xl">
        <Breadcrumb userData={user} />
        <ProfileIdentityBar user={user} identityRef={profileIdentityRef} />
        <div className="border-border-card bg-secondary-bg overflow-hidden rounded-2xl border">
          {/* Banner Section: the owner can click it to upload a new one. */}
          <div className="relative">
            <Banner
              userId={user.id}
              username={user.username}
              banner={user.banner}
              customBanner={user.custom_banner}
              settings={user.settings_v2}
              premiumType={user.premiumtype}
            />
            {isOwnProfile && (
              <BannerEditOverlay
                userData={user}
                onUploaded={handleProfileBannerUploaded}
              />
            )}
          </div>

          {/* Profile Content */}
          <div className="px-5 pt-5 pb-6 sm:px-6 md:px-8 md:pb-8">
            <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 md:flex md:items-start md:gap-7">
              {/* Avatar - smaller on mobile */}
              <div className="relative z-30 -mt-10 flex shrink-0 flex-col items-center">
                <div
                  className={cn(
                    "bg-secondary-bg relative p-1",
                    user.premiumtype === 3 ? "rounded-[20px]" : "rounded-full",
                  )}
                >
                  <UserAvatar
                    userId={user.id}
                    avatarHash={user.avatar}
                    username={user.username}
                    size={38}
                    custom_avatar={user.custom_avatar}
                    isOnline={
                      user.settings_v2?.hide_presence === true
                        ? false
                        : user.presence?.status === "Online"
                    }
                    showBadge={true}
                    className={cn(
                      "[&>div]:size-24! [&>div]:min-h-24! [&>div]:min-w-24! md:[&>div]:size-38! md:[&>div]:min-h-38! md:[&>div]:min-w-38!",
                      user.premiumtype === 3 && "[&>div]:rounded-2xl!",
                    )}
                    presenceBadgeClassName="size-6! md:size-8!"
                    settings={user.settings_v2}
                    premiumType={user.premiumtype}
                  />
                  {isOwnProfile && (
                    <AvatarEditOverlay
                      userData={user}
                      onUploaded={handleProfileAvatarUploaded}
                    />
                  )}
                </div>
                <div className="mt-3 hidden max-w-44 flex-wrap items-center justify-center gap-2 md:flex">
                  {profileConnections}
                </div>
              </div>
              <div className="contents md:block md:w-full md:min-w-0 md:flex-1">
                <div className="contents md:flex md:justify-between md:gap-5">
                  <div className="contents md:block md:min-w-0 md:flex-1 md:text-left">
                    <div className="contents md:flex md:flex-wrap md:items-center md:gap-x-3 md:gap-y-1">
                      <div className="min-w-0 md:contents">
                        <h1
                          ref={profileIdentityRef}
                          className="text-primary-text max-w-full min-w-0 truncate text-3xl font-bold tracking-tight md:text-4xl"
                        >
                          {user.global_name && user.global_name !== "None"
                            ? user.global_name
                            : user.username}
                        </h1>
                        <p className="text-secondary-text mt-1 truncate text-sm md:order-3 md:mt-0 md:w-full">
                          @{user.username}
                        </p>
                      </div>
                      <UserBadges
                        usernumber={user.usernumber}
                        premiumType={user.premiumtype}
                        flags={user.flags}
                        size="md"
                        noContainer
                        className="col-span-2 max-w-full flex-wrap justify-start md:order-2"
                        primary_guild={user.primary_guild}
                      />
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:mt-2">
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
                    </div>
                    <div className="col-span-2 flex flex-col items-start gap-3 md:mt-2">
                      {/* Follower/Following Counts */}
                      <div className="flex flex-wrap items-center gap-6">
                        <button
                          onClick={() =>
                            followerCount > 0 && setIsFollowersModalOpen(true)
                          }
                          className={`group text-secondary-text focus-visible:outline-border-focus inline-flex items-baseline gap-2 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-offset-4 ${followerCount > 0 ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <span
                            className={`text-primary-text text-sm font-semibold tabular-nums ${followerCount > 0 ? "group-hover:text-link-hover transition-colors" : ""}`}
                          >
                            {followerCount}
                          </span>{" "}
                          {followerCount === 1 ? "follower" : "followers"}
                        </button>
                        <button
                          onClick={() =>
                            followingCount > 0 && setIsFollowingModalOpen(true)
                          }
                          className={`group text-secondary-text focus-visible:outline-border-focus inline-flex items-baseline gap-2 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-offset-4 ${followingCount > 0 ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <span
                            className={`text-primary-text text-sm font-semibold tabular-nums ${followingCount > 0 ? "group-hover:text-link-hover transition-colors" : ""}`}
                          >
                            {followingCount}
                          </span>{" "}
                          following
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:hidden">
                        {profileConnections}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 flex max-w-full shrink-0 flex-col items-start md:max-w-64 md:items-end md:self-start xl:max-w-none">
                    {/* Action Buttons */}
                    <div className="flex justify-start gap-2 md:flex-wrap md:justify-end">
                      {currentUserId === user.id ? (
                        <>
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className={profileActionButtonClassName}
                          >
                            <Link href="/settings">
                              <Icon
                                icon="material-symbols:settings"
                                className="size-4"
                              />
                              Settings
                            </Link>
                          </Button>
                        </>
                      ) : isAuthenticatedUser && currentUserId ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant={
                                    isFollowing ? "secondary" : "default"
                                  }
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
                            <DropdownMenuContent
                              align="end"
                              className="w-48 p-0"
                            >
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
                              {/* Mobile (< sm): flat report actions */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setIsReportUserOpen(true);
                                  setReportUserReason("");
                                }}
                                className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2 sm:hidden"
                              >
                                <Icon
                                  icon="heroicons:flag"
                                  className="mr-2 h-4 w-4"
                                />
                                Report User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-0 sm:hidden" />
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
                                    setReportImageTarget("banner");
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
                              {hasVisibleBackground && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setReportImageTarget("background");
                                    setReportBannerReason("");
                                  }}
                                  className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2 sm:hidden"
                                >
                                  <Icon
                                    icon="heroicons:flag"
                                    className="mr-2 h-4 w-4"
                                  />
                                  Report Background
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
                                        setIsReportUserOpen(true);
                                        setReportUserReason("");
                                      }}
                                      className="rounded-none px-3 py-2"
                                    >
                                      <Icon
                                        icon="heroicons:user"
                                        className="mr-2 h-4 w-4"
                                      />
                                      <div className="flex flex-col">
                                        <span>User or behavior</span>
                                        <span className="text-secondary-text text-xs font-normal">
                                          General report
                                        </span>
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-0" />
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
                                          setReportImageTarget("banner");
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
                                    {hasVisibleBackground && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setReportImageTarget("background");
                                          setReportBannerReason("");
                                        }}
                                        className="rounded-none px-3 py-2"
                                      >
                                        <Icon
                                          icon="heroicons:photo"
                                          className="mr-2 h-4 w-4"
                                        />
                                        Background
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
          </div>
        </div>
        <div className="mt-5 md:mt-6">
          <ProfileOverview
            user={user}
            currentUserId={currentUserId}
            isSiteOwner={
              currentUser?.flags?.some(
                (flag) => flag.flag === "is_owner" && flag.enabled !== false,
              ) ?? false
            }
            bio={bio}
            onBioUpdate={refreshBio}
          />
        </div>
      </div>
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={user.id}
        isOwnProfile={user.id === currentUserId}
        currentUserId={currentUserId}
        onFollowChange={(type) => {
          onProfileDataChange((data) => ({
            ...data,
            followingCount: Math.max(
              0,
              data.followingCount + (type === "add" ? 1 : -1),
            ),
          }));
        }}
        onCountUpdate={(count) => {
          onProfileDataChange((data) => ({ ...data, followerCount: count }));
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
          onProfileDataChange((data) => ({
            ...data,
            followingCount: Math.max(
              0,
              data.followingCount + (isFollowing ? 1 : -1),
            ),
          }));
        }}
        onCountUpdate={(count) => {
          onProfileDataChange((data) => ({ ...data, followingCount: count }));
        }}
        userData={user}
      />
      <ConfirmDialog
        isOpen={isReportUserOpen}
        onClose={() => {
          setIsReportUserOpen(false);
          setReportUserReason("");
        }}
        onConfirm={() => void handleReportUser()}
        title="Report User"
        confirmText="Submit Report"
        confirmVariant="destructive"
        confirmDisabled={!reportUserReason.trim() || isSubmittingUserReport}
        closeOnConfirm={false}
      >
        <div className="space-y-4">
          <div className="border-border-card bg-tertiary-bg/50 flex items-center gap-3 rounded-lg border p-3">
            <UserAvatar
              userId={user.id}
              avatarHash={user.avatar}
              username={user.username}
              custom_avatar={user.custom_avatar}
              size={9}
              showBadge={false}
              settings={user.settings_v2}
              premiumType={user.premiumtype}
            />
            <div className="min-w-0">
              <p className="text-primary-text truncate text-sm font-medium">
                {user.global_name && user.global_name !== "None"
                  ? user.global_name
                  : user.username}
              </p>
              <p className="text-secondary-text truncate text-xs">
                @{user.username}
              </p>
            </div>
          </div>
          <div className="bg-button-info/10 border-button-info flex items-start gap-4 rounded-lg border p-4 shadow-sm">
            <div className="relative z-10">
              <div className="text-secondary-text">
                Use this for behavior or activity that is not covered by a
                specific content report.
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="report-user-reason"
              className="text-primary-text mb-1.5 block text-sm font-medium"
            >
              Reason for reporting
            </label>
            <textarea
              id="report-user-reason"
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              autoFocus
              placeholder="Describe what happened and include any useful context..."
              value={reportUserReason}
              onChange={(e) => setReportUserReason(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reportUserReason.length >= 500 ? "text-red-500" : "text-secondary-text"}`}
            >
              {reportUserReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>
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
        isOpen={reportImageTarget !== null}
        onClose={() => {
          setReportImageTarget(null);
          setReportBannerReason("");
        }}
        onConfirm={() => void handleReportBanner()}
        title={
          reportImageTarget === "background"
            ? "Report Background"
            : "Report Banner"
        }
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
                reportImageTarget === "background"
                  ? (user.custom_background ?? undefined)
                  : user.settings_v2?.custom_banner === true &&
                      user.premiumtype &&
                      user.premiumtype >= 2 &&
                      user.custom_banner &&
                      user.custom_banner !== "N/A"
                    ? user.custom_banner
                    : user.banner && user.banner !== "None"
                      ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}?size=512`
                      : undefined
              }
              alt={`${user.username}'s ${reportImageTarget ?? "banner"}`}
              className="object-contain"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <p className="text-secondary-text text-sm">
            Please describe why you are reporting this{" "}
            {reportImageTarget ?? "banner"}.
          </p>
          <div>
            <textarea
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              placeholder={`Explain why you're reporting this ${reportImageTarget ?? "banner"}...`}
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
