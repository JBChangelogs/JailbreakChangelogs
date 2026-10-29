"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, FriendRow } from "@/components/Users/Friends";
import { useAuthContext } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logger";
import type { UserSettingsV2 } from "@/types/auth";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { profileSocialQueryOptions } from "@/utils/api/profileSocialQueries";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";

const log = createLogger("UI");

type Kind = "followers" | "following";

interface ProfileUser {
  id: string;
  username: string;
  global_name: string;
  settings_v2?: UserSettingsV2;
}

export function FollowList({ userId, kind }: { userId: string; kind: Kind }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthContext();
  const currentUserId = currentUser?.id ?? null;
  const isOwnProfile = currentUserId === userId;
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const userQuery = useQuery({
    queryKey: ["user-basic", userId],
    queryFn: () =>
      fetchUserById(userId, PUBLIC_API_URL) as Promise<ProfileUser | null>,
    retry: false,
  });
  const profile = userQuery.data;
  const hidden = (k: Kind) =>
    !isOwnProfile &&
    profile?.settings_v2?.[
      k === "followers" ? "hide_followers" : "hide_following"
    ] === true;

  const followers = useQuery({
    ...profileSocialQueryOptions("followers", userId, currentUserId),
    enabled: Boolean(profile) && !hidden("followers"),
  });
  const following = useQuery({
    ...profileSocialQueryOptions("following", userId, currentUserId),
    enabled: Boolean(profile) && !hidden("following"),
  });
  const viewerFollowingOptions = profileSocialQueryOptions(
    "following",
    currentUserId ?? "",
    currentUserId,
  );
  const viewerFollowing = useQuery({
    ...viewerFollowingOptions,
    enabled: isOwnProfile,
  });
  const followingIds = new Set(
    (viewerFollowing.data ?? []).map((entry) => entry.following_id),
  );

  const listQuery = kind === "followers" ? followers : following;
  const users = (listQuery.data ?? []).flatMap((entry) =>
    entry.user ? [{ user: entry.user, since: entry.created_at }] : [],
  );
  const query = search.trim().toLowerCase();
  const shown = users.filter(
    ({ user }) =>
      !query ||
      user.username.toLowerCase().includes(query) ||
      user.global_name?.toLowerCase().includes(query),
  );

  const toggleFollow = async (targetId: string) => {
    if (!currentUserId || pending[targetId]) return;
    const isFollowing = followingIds.has(targetId);
    setPending((prev) => ({ ...prev, [targetId]: true }));
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/me/following/${encodeURIComponent(targetId)}`,
      );
      const response = await fetch(url, {
        method: isFollowing ? "DELETE" : "PUT",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error(isFollowing ? "unfollow user failed" : "follow user failed", {
          status: response.status,
          body,
        });
        throw new Error(
          isFollowing ? "Failed to unfollow user" : "Failed to follow user",
        );
      }

      await queryClient.cancelQueries({
        queryKey: viewerFollowingOptions.queryKey,
        exact: true,
      });
      queryClient.setQueryData(viewerFollowingOptions.queryKey, (data = []) =>
        isFollowing
          ? data.filter((entry) => entry.following_id !== targetId)
          : [
              ...data,
              {
                user_id: currentUserId,
                following_id: targetId,
                created_at: new Date().toISOString(),
                user: users.find(({ user }) => user.id === targetId)?.user,
              },
            ],
      );
      void queryClient.invalidateQueries({
        queryKey: ["following", currentUserId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["followers", targetId],
      });
      toast.success(
        isFollowing
          ? "Successfully unfollowed user"
          : "Successfully followed user",
      );
      window.rybbit?.event(isFollowing ? "Unfollow User" : "Follow User", {
        location: kind === "followers" ? "Followers Page" : "Following Page",
      });
    } catch (err) {
      log.error("Error updating follow status:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update follow status",
      );
    } finally {
      setPending((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  if (userQuery.isError || (userQuery.isSuccess && !profile)) {
    const message = userQuery.error?.message ?? "";
    return (
      <EmptyState
        icon="heroicons:user"
        text={
          message.startsWith("BANNED_USER:")
            ? message.replace("BANNED_USER:", "").trim()
            : "User not found."
        }
      />
    );
  }

  const count = (list: unknown[] | undefined, k: Kind) =>
    hidden(k) || !list ? "" : ` (${list.length})`;

  return (
    <>
      <Breadcrumb
        userData={profile}
        loading={userQuery.isPending}
        containerClassName="mx-auto max-w-5xl py-4"
      />
      <div className="mx-auto max-w-5xl space-y-4">
        <Tabs
          value={kind}
          onValueChange={(value) => router.replace(`/users/${userId}/${value}`)}
        >
          <TabsList fullWidth>
            <TabsTrigger value="followers" fullWidth>
              Followers{count(followers.data, "followers")}
            </TabsTrigger>
            <TabsTrigger value="following" fullWidth>
              Following{count(following.data, "following")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="border-border-card bg-secondary-bg rounded-lg border p-2 sm:p-4">
          {userQuery.isPending || (listQuery.isPending && !hidden(kind)) ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-8 w-8" />
            </div>
          ) : hidden(kind) ? (
            <EmptyState
              icon="heroicons:lock-closed"
              text={`This user has chosen to keep their ${kind} private.`}
            />
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-sm">
              <p className="text-status-error">Failed to load {kind}.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void listQuery.refetch()}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {users.length > 0 && (
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder={`Search ${kind}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pl-10 transition-all duration-300 focus:outline-none"
                  />
                  <Icon
                    icon="heroicons:magnifying-glass"
                    className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
                  />
                </div>
              )}
              {shown.length === 0 ? (
                <EmptyState
                  icon="heroicons:users"
                  text={
                    query
                      ? `No ${kind} match your search.`
                      : kind === "followers"
                        ? "No followers yet."
                        : "Not following anyone yet."
                  }
                />
              ) : (
                shown.map(({ user, since }) => (
                  <FriendRow
                    key={user.id}
                    user={user}
                    detail={`${kind === "followers" ? "Followed" : "Following"} since ${formatMonthDayYear(since)}`}
                  >
                    {isOwnProfile && (
                      <Button
                        variant={
                          followingIds.has(user.id) ? "secondary" : "default"
                        }
                        size="sm"
                        onClick={() => void toggleFollow(user.id)}
                        disabled={pending[user.id] || viewerFollowing.isPending}
                      >
                        {followingIds.has(user.id) ? "Unfollow" : "Follow"}
                      </Button>
                    )}
                  </FriendRow>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
