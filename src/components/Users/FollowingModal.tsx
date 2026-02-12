import React, { useState, useEffect, useRef } from "react";
import { Dialog, CircularProgress } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { UserAvatar } from "@/utils/avatar";
import Link from "next/link";
import { toast } from "sonner";
import { UserSettings } from "@/types/auth";

interface Following {
  user_id: string;
  following_id: string;
  created_at: string;
  user: User;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  settings?: UserSettings;
  premiumtype?: number;
}

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | null;
  onFollowChange?: (isFollowing: boolean) => void;
  onCountUpdate?: (count: number) => void;
  userData: User;
}

const FollowingModal: React.FC<FollowingModalProps> = ({
  isOpen,
  onClose,
  userId,
  isOwnProfile,
  currentUserId,
  onFollowChange,
  onCountUpdate,
  userData,
}) => {
  const [following, setFollowing] = useState<Following[]>([]);
  const [followingDetails, setFollowingDetails] = useState<{
    [key: string]: User;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingFollow, setLoadingFollow] = useState<{
    [key: string]: boolean;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Store callbacks and values in refs to avoid unnecessary re-renders
  const onCountUpdateRef = useRef(onCountUpdate);
  const onCloseRef = useRef(onClose);
  const isOwnProfileRef = useRef(isOwnProfile);
  const userDataRef = useRef(userData);

  useEffect(() => {
    onCountUpdateRef.current = onCountUpdate;
    onCloseRef.current = onClose;
    isOwnProfileRef.current = isOwnProfile;
    userDataRef.current = userData;
  }, [onCountUpdate, onClose, isOwnProfile, userData]);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);
      setIsPrivate(false);

      try {
        // Check privacy settings using the passed userData
        if (
          userDataRef.current.settings?.hide_following === 1 &&
          !isOwnProfileRef.current
        ) {
          setIsPrivate(true);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/users/following/get?user=${userId}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-Following/1.0",
            },
            cache: "no-store",
          },
        );

        if (response.status === 404) {
          setFollowing([]);
          setFollowingDetails({});
          onCloseRef.current();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch following");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          setFollowing([]);
          setFollowingDetails({});
          onCloseRef.current();
          return;
        }

        setFollowing(data);

        // Update the following count in the parent component with fresh data
        if (onCountUpdateRef.current) {
          onCountUpdateRef.current(data.length);
        }

        // Initialize following status for all users in the list
        const initialFollowingStatus = data.reduce(
          (acc, followingItem) => {
            if (followingItem.following_id) {
              acc[followingItem.following_id] = true;
            }
            return acc;
          },
          {} as { [key: string]: boolean },
        );
        setFollowingStatus(initialFollowingStatus);

        // User data is now included in the API response, so we can use it directly
        const detailsMap: Record<string, User> = {};
        data.forEach((followingItem: Following) => {
          if (followingItem.user && followingItem.user.id) {
            detailsMap[followingItem.following_id] = {
              id: followingItem.user.id,
              username: followingItem.user.username,
              avatar: followingItem.user.avatar,
              global_name: followingItem.user.global_name,
              usernumber: followingItem.user.usernumber || 0,
              accent_color: followingItem.user.accent_color || "None",
              custom_avatar: followingItem.user.custom_avatar,
              settings: followingItem.user.settings,
              premiumtype: followingItem.user.premiumtype,
            };
          }
        });

        setFollowingDetails(detailsMap);
      } catch (err) {
        console.error("Error fetching following:", err);
        setError("Failed to load following");
      } finally {
        setLoading(false);
      }
    };

    // Fetch following every time the modal opens or userId changes
    if (isOpen) {
      fetchFollowing();
    }
  }, [isOpen, userId]);

  const handleFollowToggle = async (followingId: string) => {
    if (!currentUserId || loadingFollow[followingId]) return;

    setLoadingFollow((prev) => ({ ...prev, [followingId]: true }));
    try {
      if (!currentUserId) {
        toast.error("You need to be logged in to follow users");
        return;
      }

      const isCurrentlyFollowing = followingStatus[followingId];
      const response = await fetch(
        `/api/users/followers/${isCurrentlyFollowing ? "remove" : "add"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ following: followingId }),
        },
      );

      if (!response.ok) {
        throw new Error(
          isCurrentlyFollowing
            ? "Failed to unfollow user"
            : "Failed to follow user",
        );
      }

      setFollowingStatus((prev) => ({
        ...prev,
        [followingId]: !isCurrentlyFollowing,
      }));
      onFollowChange?.(!isCurrentlyFollowing);
      toast.success(
        isCurrentlyFollowing
          ? "Successfully unfollowed user"
          : "Successfully followed user",
      );

      window.umami?.track(
        isCurrentlyFollowing ? "Unfollow User" : "Follow User",
        {
          location: "Following Modal",
        },
      );

      // Refresh following list after successful follow/unfollow
      // The useEffect will handle the refetch when isOpen changes
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update follow status",
      );
    } finally {
      setLoadingFollow((prev) => ({ ...prev, [followingId]: false }));
    }
  };

  const filteredFollowing = following.filter((following) => {
    const user = followingDetails[following.following_id];
    if (!user) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      (user.global_name && user.global_name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
    >
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="modal-container border-button-info bg-primary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex items-center justify-between px-6 py-4 text-xl font-semibold">
            <span>Following ({following.length})</span>
            <button
              onClick={onClose}
              className="text-primary-text hover:text-primary-text transition-colors"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          </div>

          <div className="modal-content max-h-[400px] overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center py-4 sm:py-8">
                <CircularProgress sx={{ color: "var(--color-button-info)" }} />
              </div>
            ) : isPrivate ? (
              <div className="text-primary-text py-4 text-center text-sm sm:py-8">
                This user has hidden their following
              </div>
            ) : (
              <>
                <div className="mb-2 sm:mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search following..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
                    />
                    <Icon
                      icon="heroicons:magnifying-glass"
                      className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                        aria-label="Clear search"
                      >
                        <Icon icon="heroicons:x-mark" />
                      </button>
                    )}
                  </div>
                </div>
                {error ? (
                  <div className="text-status-error py-4 text-center text-sm sm:py-8">
                    {error}
                  </div>
                ) : filteredFollowing.length === 0 ? (
                  <div className="text-primary-text py-4 text-center text-sm sm:py-8">
                    {searchQuery
                      ? "No results found"
                      : "Not following anyone yet"}
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-4">
                    {filteredFollowing.map((following) => {
                      const user = followingDetails[following.following_id];
                      if (!user) return null;

                      return (
                        <div
                          key={following.following_id}
                          className="group hover:bg-secondary-bg flex items-center justify-between rounded-lg p-1.5 transition-colors sm:p-3"
                        >
                          <Link
                            href={`/users/${user.id}`}
                            prefetch={false}
                            className="block flex-1"
                          >
                            <div className="flex items-center space-x-1.5 sm:space-x-3">
                              <UserAvatar
                                userId={user.id}
                                avatarHash={user.avatar}
                                username={user.username}
                                size={10}
                                custom_avatar={user.custom_avatar}
                                showBadge={false}
                                settings={user.settings}
                                premiumType={user.premiumtype}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <h3 className="text-primary-text group-hover:text-link-hover max-w-[180px] truncate text-sm font-semibold transition-colors sm:max-w-[250px] sm:text-base">
                                    {user.global_name &&
                                    user.global_name !== "None"
                                      ? user.global_name
                                      : user.username}
                                  </h3>
                                </div>
                                <p className="text-secondary-text max-w-[180px] truncate text-[10px] sm:max-w-[250px] sm:text-sm">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          </Link>
                          {isOwnProfile && (
                            <Button
                              variant={
                                followingStatus[user.id]
                                  ? "secondary"
                                  : "default"
                              }
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleFollowToggle(user.id);
                              }}
                              disabled={loadingFollow[user.id]}
                              className="ml-2 h-7 px-2 text-xs"
                            >
                              {loadingFollow[user.id]
                                ? "..."
                                : followingStatus[user.id]
                                  ? "Unfollow"
                                  : "Follow"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default FollowingModal;
