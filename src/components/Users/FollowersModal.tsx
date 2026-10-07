import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  profileSocialQueryOptions,
  type ProfileSocialUser as User,
} from "@/utils/api/profileSocialQueries";

const log = createLogger("UI");

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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingFollow, setLoadingFollow] = useState<Record<string, boolean>>(
    {},
  );
  const isPrivate =
    userData.settings_v2?.hide_followers === true && !isOwnProfile;
  const listQuery = useQuery({
    ...profileSocialQueryOptions("followers", userId, currentUserId),
    enabled: isOpen && !isPrivate,
  });
  const viewerFollowingOptions = profileSocialQueryOptions(
    "following",
    currentUserId ?? "",
    currentUserId,
  );
  const viewerFollowingQuery = useQuery({
    ...viewerFollowingOptions,
    enabled: isOpen && Boolean(currentUserId),
  });
  const followers = isPrivate ? [] : (listQuery.data ?? []);
  const followingStatus = Object.fromEntries(
    (viewerFollowingQuery.data ?? []).map((entry) => [
      entry.following_id,
      true,
    ]),
  );
  const loading = !isPrivate && listQuery.isLoading;
  const error = listQuery.isError ? "Failed to load followers" : null;

  // Inline parent callbacks change on render; notify only when query data changes.
  const onCountUpdateRef = useRef(onCountUpdate);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCountUpdateRef.current = onCountUpdate;
    onCloseRef.current = onClose;
  }, [onCountUpdate, onClose]);

  useEffect(() => {
    if (!isOpen || isPrivate || !listQuery.isSuccess || listQuery.isFetching)
      return;
    onCountUpdateRef.current?.(listQuery.data.length);
    if (listQuery.data.length === 0) onCloseRef.current();
  }, [
    isOpen,
    isPrivate,
    listQuery.data,
    listQuery.isSuccess,
    listQuery.isFetching,
  ]);

  useEffect(() => {
    if (listQuery.error)
      log.error("Error fetching followers:", listQuery.error);
  }, [listQuery.error]);

  const handleFollow = async (followerId: string) => {
    if (!currentUserId || loadingFollow[followerId]) return;

    setLoadingFollow((prev) => ({ ...prev, [followerId]: true }));
    try {
      if (!currentUserId) {
        toast.info("You need to be logged in to follow users");
        return;
      }

      const isCurrentlyFollowing = followingStatus[followerId];
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/me/following/${encodeURIComponent(followerId)}`,
      );
      const response = await fetch(url, {
        method: isCurrentlyFollowing ? "DELETE" : "PUT",
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error(
          isCurrentlyFollowing ? "unfollow user failed" : "follow user failed",
          { status: response.status, body },
        );
        throw new Error(
          isCurrentlyFollowing
            ? "Failed to unfollow user"
            : "Failed to follow user",
        );
      }

      await queryClient.cancelQueries({
        queryKey: viewerFollowingOptions.queryKey,
        exact: true,
      });
      queryClient.setQueryData(viewerFollowingOptions.queryKey, (data = []) =>
        isCurrentlyFollowing
          ? data.filter((entry) => entry.following_id !== followerId)
          : [
              ...data,
              {
                user_id: currentUserId,
                following_id: followerId,
                created_at: new Date().toISOString(),
                user: followers.find(
                  (entry) => entry.follower_id === followerId,
                )?.user,
              },
            ],
      );
      void queryClient.invalidateQueries({
        queryKey: ["following", currentUserId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["followers", followerId],
      });
      onFollowChange?.(isCurrentlyFollowing ? "remove" : "add");
      toast.success(
        isCurrentlyFollowing
          ? "Successfully unfollowed user"
          : "Successfully followed user",
      );

      window.rybbit?.event(
        isCurrentlyFollowing ? "Unfollow User" : "Follow User",
        { location: "Followers Modal" },
      );
    } catch (err) {
      log.error("Error updating follow status:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update follow status",
      );
    } finally {
      setLoadingFollow((prev) => ({ ...prev, [followerId]: false }));
    }
  };

  const filteredFollowers = followers.filter((follower) => {
    const user = follower.user;
    if (!user) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      (user.global_name && user.global_name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-secondary-bg max-w-120 rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Followers ({followers.length})
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pt-4 pb-6">
          {loading ? (
            <div className="flex justify-center py-4 sm:py-8">
              <Spinner className="h-8 w-8" />
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
                    className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
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
                    const user = follower.user;
                    if (!user) return null;

                    return (
                      <div
                        key={follower.follower_id}
                        className="group hover:bg-tertiary-bg flex items-center justify-between rounded-lg p-1.5 transition-colors sm:p-3"
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
                              cdnSize={512}
                              custom_avatar={user.custom_avatar}
                              showBadge={false}
                              settings={user.settings_v2}
                              premiumType={user.premiumtype}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <h3 className="text-primary-text group-hover:text-link-hover max-w-45 truncate text-sm font-semibold transition-colors sm:max-w-62.5 sm:text-base">
                                  {user.global_name &&
                                  user.global_name !== "None"
                                    ? user.global_name
                                    : user.username}
                                </h3>
                              </div>
                              <p className="text-secondary-text max-w-45 truncate text-[10px] sm:max-w-62.5 sm:text-sm">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </Link>
                        {isOwnProfile && (
                          <Button
                            variant={
                              followingStatus[user.id] ? "secondary" : "default"
                            }
                            size="sm"
                            onClick={() => handleFollow(user.id)}
                            disabled={
                              loadingFollow[user.id] ||
                              viewerFollowingQuery.isLoading
                            }
                            className="ml-2"
                          >
                            {loadingFollow[user.id]
                              ? followingStatus[user.id]
                                ? "Unfollowing..."
                                : "Following..."
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

        <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;
