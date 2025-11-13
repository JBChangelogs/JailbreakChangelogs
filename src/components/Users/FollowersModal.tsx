import React, { useState, useEffect } from "react";
import { Dialog, CircularProgress } from "@mui/material";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { UserAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { UserSettings } from "@/types/auth";

interface Follower {
  user_id: string;
  follower_id: string;
  created_at: string;
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
  userData: User;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  isOwnProfile,
  currentUserId,
  onFollowChange,
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);
      setIsPrivate(false);

      try {
        // Check privacy settings using the passed userData
        if (userData.settings?.hide_followers === 1 && !isOwnProfile) {
          setIsPrivate(true);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${PUBLIC_API_URL}/users/followers/get?user=${userId}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-Followers/1.0",
            },
          },
        );

        if (response.status === 404) {
          setFollowers([]);
          onClose();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch followers");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          setFollowers([]);
          onClose();
          return;
        }

        setFollowers(data);

        // Fetch details for each follower
        const followerIds = data.map(
          (follower: Follower) => follower.follower_id,
        );
        const uniqueFollowerIds = [...new Set(followerIds)];

        // Filter out the current user's own ID since we already have that data
        const idsToFetch = uniqueFollowerIds.filter((id) => id !== userData.id);

        try {
          if (idsToFetch.length > 0) {
            const userResponse = await fetch(
              `${PUBLIC_API_URL}/users/get/batch?ids=${idsToFetch.join(",")}&nocache=true`,
              {
                headers: {
                  "User-Agent": "JailbreakChangelogs-Followers/1.0",
                },
              },
            );
            if (userResponse.ok) {
              const userDataArray = await userResponse.json();
              const detailsMap = userDataArray.reduce(
                (acc: Record<string, User>, userData: User) => {
                  acc[userData.id] = userData;
                  return acc;
                },
                {},
              );

              // Add current user's data if they're in the followers list
              if (followerIds.includes(userData.id)) {
                detailsMap[userData.id] = userData;
              }

              setFollowerDetails(detailsMap);
            }
          } else if (followerIds.includes(userData.id)) {
            // Only current user in followers list
            setFollowerDetails({ [userData.id]: userData });
          } else {
            setFollowerDetails({});
          }
        } catch (err) {
          console.error("Error fetching follower details:", err);
          setFollowerDetails({});
        }
      } catch (err) {
        console.error("Error fetching followers:", err);
        setError("Failed to load followers");
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      fetchFollowers();
    }
  }, [isOpen, userId, onClose, isOwnProfile, userData, isInitialLoad]);

  useEffect(() => {
    const fetchFollowingStatus = async () => {
      if (!isOpen || !currentUserId) return;

      try {
        const response = await fetch(
          `${PUBLIC_API_URL}/users/following/get?user=${currentUserId}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-Followers/1.0",
            },
          },
        );
        if (!response.ok) return;

        const followingData = await response.json();
        if (!Array.isArray(followingData)) return;

        const statusMap = followingData.reduce(
          (acc: { [key: string]: boolean }, follow: Following) => {
            acc[follow.following_id] = true;
            return acc;
          },
          {},
        );

        setFollowingStatus(statusMap);
      } catch (err) {
        console.error("Error fetching following status:", err);
      }
    };

    fetchFollowingStatus();
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
      setIsInitialLoad(true);
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
        <div className="modal-container bg-primary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex items-center justify-between px-6 py-4 text-xl font-semibold">
            <span>Followers ({followers.length})</span>
            <button
              onClick={onClose}
              className="text-primary-text hover:text-primary-text cursor-pointer transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
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
                      className="text-primary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
                    />
                    <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                        aria-label="Clear search"
                      >
                        <XMarkIcon />
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
