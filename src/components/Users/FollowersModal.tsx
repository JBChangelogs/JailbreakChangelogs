import React, { useState, useEffect, useRef } from "react";
import { Dialog, CircularProgress } from "@mui/material";
import { Icon } from "@/components/ui/IconWrapper";
import { UserAvatar } from "@/utils/avatar";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { UserSettings } from "@/types/auth";

interface Follower {
  user_id: string;
  follower_id: string;
  created_at: string;
  user: User;
}

interface Following {
  user_id: string;
  following_id: string;
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
  settings?: UserSettings;
  premiumtype?: number;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | null;
  onFollowChange?: (type: "add" | "remove") => void;
  onCountUpdate?: (count: number) => void;
  userData: User;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  isOwnProfile,
  currentUserId,
  onFollowChange,
  onCountUpdate,
  userData,
}) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [followerDetails, setFollowerDetails] = useState<{
    [key: string]: User;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingStatus, setFollowingStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingFollow, setLoadingFollow] = useState<{
    [key: string]: boolean;
  }>({});
  const [isPrivate, setIsPrivate] = useState(false);

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
    const fetchFollowers = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);
      setIsPrivate(false);

      try {
        // Check privacy settings using the passed userData
        if (
          userDataRef.current.settings?.hide_followers === 1 &&
          !isOwnProfileRef.current
        ) {
          setIsPrivate(true);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/users/followers/get?user=${userId}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-Followers/1.0",
            },
            cache: "no-store",
          },
        );

        if (response.status === 404) {
          setFollowers([]);
          setFollowerDetails({});
          onCloseRef.current();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch followers");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          setFollowers([]);
          setFollowerDetails({});
          onCloseRef.current();
          return;
        }

        setFollowers(data);

        // Update the follower count in the parent component with fresh data
        if (onCountUpdateRef.current) {
          onCountUpdateRef.current(data.length);
        }

        // User data is now included in the API response, so we can use it directly
        const detailsMap: Record<string, User> = {};
        data.forEach((follower: Follower) => {
          if (follower.user && follower.user.id) {
            detailsMap[follower.follower_id] = {
              id: follower.user.id,
              username: follower.user.username,
              avatar: follower.user.avatar,
              global_name: follower.user.global_name,
              usernumber: follower.user.usernumber || 0,
              accent_color: follower.user.accent_color || "None",
              custom_avatar: follower.user.custom_avatar,
              settings: follower.user.settings,
              premiumtype: follower.user.premiumtype,
            };
          }
        });

        setFollowerDetails(detailsMap);
      } catch (err) {
        console.error("Error fetching followers:", err);
        setError("Failed to load followers");
      } finally {
        setLoading(false);
      }
    };

    // Fetch followers every time the modal opens or userId changes
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const fetchFollowingStatus = async () => {
      if (!isOpen || !currentUserId) return;

      try {
        // Use API route instead of direct API call
        // Call this every time the modal opens to get fresh following status
        const response = await fetch(
          `/api/users/following/get?user=${currentUserId}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-Followers/1.0",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) return;

        const followingData = await response.json();
        if (!Array.isArray(followingData)) return;
        const statusMap = followingData.reduce(
          (acc: { [key: string]: boolean }, follow: Following) => {
            if (follow.following_id) {
              acc[follow.following_id] = true;
            }
            return acc;
          },
          {},
        );

        setFollowingStatus(statusMap);
      } catch (err) {
        console.error("Error fetching following status:", err);
      }
    };

    // Fetch following status every time the modal opens
    if (isOpen) {
      fetchFollowingStatus();
    }
  }, [isOpen, currentUserId]);

  const handleFollow = async (followerId: string) => {
    if (!currentUserId || loadingFollow[followerId]) return;

    setLoadingFollow((prev) => ({ ...prev, [followerId]: true }));
    try {
      if (!currentUserId) {
        toast.error("You need to be logged in to follow users");
        return;
      }

      const response = await fetch("/api/users/followers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following: followerId }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow user");
      }

      setFollowingStatus((prev) => ({ ...prev, [followerId]: true }));
      onFollowChange?.("add");
      toast.success("Successfully followed user");

      // Refresh followers list after successful follow
      // Trigger a refetch by toggling isOpen or calling fetchFollowers directly
      // The useEffect will handle the refetch when isOpen changes
    } catch (err) {
      console.error("Error following user:", err);
      toast.error("Failed to follow user");
    } finally {
      setLoadingFollow((prev) => ({ ...prev, [followerId]: false }));
    }
  };

  const filteredFollowers = followers.filter((follower) => {
    const user = followerDetails[follower.follower_id];
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
            <span>Followers ({followers.length})</span>
            <button
              onClick={onClose}
              className="text-primary-text hover:text-primary-text cursor-pointer transition-colors"
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
                This user has hidden their followers
              </div>
            ) : (
              <>
                <div className="mb-2 sm:mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search followers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
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
                ) : filteredFollowers.length === 0 ? (
                  <div className="text-primary-text py-4 text-center text-sm sm:py-8">
                    {searchQuery ? "No results found" : "No followers yet"}
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-4">
                    {filteredFollowers.map((follower) => {
                      const user = followerDetails[follower.follower_id];
                      if (!user) return null;

                      return (
                        <div
                          key={follower.follower_id}
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
                                  {isOwnProfile &&
                                    !followingStatus[user.id] && (
                                      <>
                                        {!loadingFollow[user.id] && (
                                          <span className="text-primary-text">
                                            ·
                                          </span>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleFollow(user.id);
                                          }}
                                          disabled={loadingFollow[user.id]}
                                          className="text-button-info hover:text-button-info-hover disabled:text-primary-text text-xs whitespace-nowrap hover:cursor-pointer hover:underline sm:text-sm"
                                        >
                                          {loadingFollow[user.id] ? (
                                            <CircularProgress
                                              size={10}
                                              sx={{
                                                color:
                                                  "var(--color-button-info)",
                                              }}
                                            />
                                          ) : (
                                            "Follow"
                                          )}
                                        </button>
                                      </>
                                    )}
                                </div>
                                <p className="text-secondary-text max-w-[180px] truncate text-[10px] sm:max-w-[250px] sm:text-sm">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          </Link>
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

export default FollowersModal;
