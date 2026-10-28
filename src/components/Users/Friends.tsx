"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FriendButton,
  UserProfilePopover,
} from "@/components/Users/UserProfilePopover";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  fetchMutualFriendsPage,
  useFriendship,
  useMyFriends,
  type FriendUser,
} from "@/hooks/useFriendship";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import { UserAvatar } from "@/utils/ui/avatar";

const displayName = (user: FriendUser) =>
  user.global_name && user.global_name !== "None"
    ? user.global_name
    : user.username;

/** Avatar and names (opening their card), with `children` on the right. */
function FriendRow({
  user,
  detail,
  children,
}: {
  user: FriendUser;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hover:bg-tertiary-bg flex items-center gap-3 rounded-lg p-2 transition-colors sm:p-3">
      <UserProfilePopover user={user}>
        <Link
          href={`/users/${user.id}`}
          prefetch={false}
          className="group flex min-w-0 flex-1 items-center gap-3"
        >
          <UserAvatar
            userId={user.id}
            avatarHash={user.avatar ?? null}
            username={user.username}
            custom_avatar={user.custom_avatar ?? undefined}
            premiumType={user.premiumtype}
            size={10}
            showBadge={false}
            bgClassName="bg-tertiary-bg"
          />
          <div className="min-w-0">
            <p className="text-primary-text group-hover:text-link-hover truncate font-semibold transition-colors">
              {displayName(user)}
            </p>
            <p className="text-secondary-text truncate text-sm">
              @{user.username}
              {detail && (
                <span className="text-tertiary-text"> · {detail}</span>
              )}
            </p>
          </div>
        </Link>
      </UserProfilePopover>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-secondary-text flex flex-col items-center gap-2 py-10 text-center text-sm">
      <Icon icon={icon} className="text-tertiary-text h-10 w-10" />
      {text}
    </div>
  );
}

function useMutualFriends(userId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["friends", "mutual", userId],
    queryFn: ({ pageParam }) => fetchMutualFriendsPage(userId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.total_pages ? last.page + 1 : undefined,
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * "N mutual friends" on someone else's profile, opening the list. Hidden
 * when you share none, they hide their friends (403), or it's your profile.
 */
export function MutualFriendsCount({ userId }: { userId: string }) {
  const { isAuthenticated, user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const mutual = useMutualFriends(
    userId,
    isAuthenticated && user?.id !== userId,
  );
  const total = mutual.data?.pages[0]?.total ?? 0;
  if (!total) return null;

  const friends = mutual.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group text-secondary-text focus-visible:outline-border-focus inline-flex cursor-pointer items-baseline gap-2 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <span className="text-primary-text group-hover:text-link-hover text-sm font-semibold tabular-nums transition-colors">
          {total}
        </span>{" "}
        {total === 1 ? "mutual friend" : "mutual friends"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-secondary-bg max-w-120 rounded-lg p-0 backdrop-blur-none"
          showClose
          aria-describedby={undefined}
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-primary-text text-xl font-semibold">
              Mutual Friends ({total})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
            {friends.map((friend) => (
              <FriendRow key={friend.id} user={friend} />
            ))}
            {mutual.hasNextPage && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
                disabled={mutual.isFetchingNextPage}
                onClick={() => void mutual.fetchNextPage()}
              >
                {mutual.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** "Remove Friend" for a profile's actions menu; nothing unless you're friends. */
export function RemoveFriendMenuItem({ userId }: { userId: string }) {
  const { status, isMutating, remove } = useFriendship(userId);
  if (status !== "friends") return null;
  return (
    <DropdownMenuItem
      disabled={isMutating}
      onClick={remove}
      className="rounded-none px-3 py-2"
    >
      <Icon icon="heroicons:user-minus" className="mr-2 h-4 w-4" />
      Remove Friend
    </DropdownMenuItem>
  );
}

/** Your friends and pending requests. Kept live by `friend_update`. */
export function FriendsPage() {
  const { isAuthenticated, isLoading, setLoginModal } = useAuthContext();
  const { friends, requests } = useMyFriends();
  const [tab, setTab] = useState<"friends" | "pending">("friends");
  const [search, setSearch] = useState("");

  if (!isAuthenticated) {
    if (isLoading) return null;
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Icon
          icon="heroicons:user-group"
          className="text-tertiary-text h-12 w-12"
        />
        <h1 className="text-primary-text text-lg font-semibold">Friends</h1>
        <p className="text-secondary-text text-sm">
          Log in to see your friends and friend requests.
        </p>
        <Button size="sm" onClick={() => setLoginModal({ open: true })}>
          Log in
        </Button>
      </div>
    );
  }

  const incoming = requests.data?.incoming ?? [];
  const outgoing = requests.data?.outgoing ?? [];
  const query = search.trim().toLowerCase();
  const shownFriends = (friends.data ?? [])
    .filter(
      (f) =>
        !query ||
        f.username.toLowerCase().includes(query) ||
        f.global_name?.toLowerCase().includes(query),
    )
    .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  const loading = friends.isPending || requests.isPending;
  const failed = friends.isError || requests.isError;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-primary-text text-2xl font-bold">Friends</h1>
      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList fullWidth>
          <TabsTrigger value="friends" fullWidth>
            Friends ({friends.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="pending" fullWidth>
            Pending ({incoming.length + outgoing.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border-border-card bg-secondary-bg rounded-lg border p-2 sm:p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        ) : failed ? (
          <div className="flex flex-col items-center gap-3 py-10 text-sm">
            <p className="text-status-error">Failed to load your friends.</p>
            <Button
              size="sm"
              onClick={() => {
                void friends.refetch();
                void requests.refetch();
              }}
            >
              Try Again
            </Button>
          </div>
        ) : tab === "friends" ? (
          <>
            {(friends.data?.length ?? 0) > 0 && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search friends..."
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
            {shownFriends.length === 0 ? (
              <EmptyState
                icon="heroicons:user-group"
                text={
                  query
                    ? "No friends match your search."
                    : "No friends yet. Add someone from their profile card."
                }
              />
            ) : (
              shownFriends.map((friend) => (
                <FriendRow
                  key={friend.id}
                  user={friend}
                  detail={`Friends since ${formatMonthDayYear(friend.friends_since)}`}
                >
                  <FriendButton userId={friend.id} />
                </FriendRow>
              ))
            )}
          </>
        ) : incoming.length + outgoing.length === 0 ? (
          <EmptyState
            icon="heroicons:inbox"
            text="No pending friend requests."
          />
        ) : (
          <div className="space-y-4">
            {[
              { label: "Received", list: incoming },
              { label: "Sent", list: outgoing },
            ].map(
              ({ label, list }) =>
                list.length > 0 && (
                  <section key={label}>
                    <h2 className="text-secondary-text px-2 pb-1 text-xs font-semibold tracking-wide uppercase">
                      {label} ({list.length})
                    </h2>
                    {list.map((request) => (
                      <FriendRow
                        key={request.id}
                        user={request}
                        detail={formatMonthDayYear(request.created_at)}
                      >
                        <FriendButton userId={request.id} />
                      </FriendRow>
                    ))}
                  </section>
                ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
