"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logger";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

const log = createLogger("UI");

export interface FriendUser {
  id: string;
  username: string;
  global_name?: string | null;
  premiumtype?: number;
  avatar?: string | null;
  custom_avatar?: string | null;
}

export type Friend = FriendUser & { friends_since: number };
type FriendRequest = FriendUser & { created_at: number };

export interface FriendsPage {
  items: Friend[];
  total: number;
  page: number;
  total_pages: number;
  size: number;
}

export interface FriendRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export type FriendshipStatus = "none" | "outgoing" | "incoming" | "friends";

/** Error codes from the friends API, worded for a toast. */
const FRIEND_ERRORS: Record<string, string> = {
  self: "You can't add yourself as a friend",
  user_not_found: "That user doesn't exist",
  blocked: "You can't add this user as a friend",
  requests_disabled: "This user isn't accepting friend requests",
  already_friends: "You're already friends",
  already_requested: "You've already sent a friend request",
  friend_limit: "Friend limit reached (100)",
  not_friends: "You're not friends with this user",
  request_not_found: "That friend request no longer exists",
};

export const FRIENDS_KEY = ["friends", "me"] as const;
export const FRIEND_REQUESTS_KEY = ["friend-requests", "me"] as const;

async function friendsFetch<T>(path: string, method = "GET"): Promise<T> {
  const { url, headers } = buildApiFetchRequest(PUBLIC_API_URL!, path);
  const response = await fetch(url, {
    method,
    credentials: "include",
    cache: "no-store",
    headers,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    log.error("friends request failed", {
      path,
      method,
      status: response.status,
      body,
    });
    const code = typeof body?.error === "string" ? body.error : "";
    // friend_limit's message says whose list is full.
    const message =
      (code === "friend_limit" && typeof body?.message === "string"
        ? body.message
        : FRIEND_ERRORS[code]) ?? "Something went wrong, try again";
    throw Object.assign(new Error(message), {
      status: response.status,
      code,
    });
  }
  return body as T;
}

export const fetchFriendsPage = (userId: string, page: number) =>
  friendsFetch<FriendsPage>(
    `/v2/users/${encodeURIComponent(userId)}/friends?page=${page}`,
  );

/** Friends you and `userId` share; 403 `hidden` when they hide friends. */
export const fetchMutualFriendsPage = (userId: string, page: number) =>
  friendsFetch<FriendsPage>(
    `/v2/users/${encodeURIComponent(userId)}/friends/mutual?page=${page}`,
  );

/** All of your friends: at most 100, so at most 7 pages of 15. */
async function fetchAllMyFriends(): Promise<Friend[]> {
  const first = await fetchFriendsPage("me", 1);
  const rest = await Promise.all(
    Array.from({ length: first.total_pages - 1 }, (_, i) =>
      fetchFriendsPage("me", i + 2),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}

/** Your friends and pending requests, shared by every friend button. */
export function useMyFriends() {
  const { isAuthenticated } = useAuthContext();
  const friends = useQuery({
    queryKey: FRIENDS_KEY,
    queryFn: fetchAllMyFriends,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const requests = useQuery({
    queryKey: FRIEND_REQUESTS_KEY,
    queryFn: () => friendsFetch<FriendRequests>("/v2/users/me/friend-requests"),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  return { friends, requests };
}

/**
 * Applies a `friend_update` frame to the cached friend state, so buttons change
 * without waiting on a refetch. Frames go to both users (and all your tabs),
 * with `status` from your side. The frame carries no profile, so one is reused
 * from whichever list already holds them; otherwise this refetches.
 */
export function applyFriendUpdate(
  queryClient: QueryClient,
  userId: string,
  status: FriendshipStatus,
) {
  const requests =
    queryClient.getQueryData<FriendRequests>(FRIEND_REQUESTS_KEY);
  const friends = queryClient.getQueryData<Friend[]>(FRIENDS_KEY);
  const isThem = (u: FriendUser) => u.id === userId;
  const known: FriendUser | undefined =
    requests?.outgoing.find(isThem) ??
    requests?.incoming.find(isThem) ??
    friends?.find(isThem);
  const others = <T extends FriendUser>(list: T[]) =>
    list.filter((u) => !isThem(u));
  const now = Date.now() / 1000;
  const request = known && { ...known, created_at: now };

  queryClient.setQueryData<FriendRequests>(
    FRIEND_REQUESTS_KEY,
    (r) =>
      r && {
        incoming:
          status === "incoming" && request
            ? [...others(r.incoming), request]
            : others(r.incoming),
        outgoing:
          status === "outgoing" && request
            ? [...others(r.outgoing), request]
            : others(r.outgoing),
      },
  );
  queryClient.setQueryData<Friend[]>(FRIENDS_KEY, (list) => {
    if (!list) return list;
    return status === "friends" && known
      ? [...others(list), { ...known, friends_since: now }]
      : others(list);
  });

  if (status !== "none" && !known) {
    void queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_KEY });
    void queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
  }
}

export function friendshipStatus(
  userId: string,
  friends: Friend[] | undefined,
  requests: FriendRequests | undefined,
): FriendshipStatus {
  if (friends?.some((f) => f.id === userId)) return "friends";
  if (requests?.incoming.some((r) => r.id === userId)) return "incoming";
  if (requests?.outgoing.some((r) => r.id === userId)) return "outgoing";
  return "none";
}

/** The friend state between you and `userId`, and the action for each state. */
export function useFriendship(userId: string) {
  const queryClient = useQueryClient();
  const { friends, requests } = useMyFriends();
  const status = friendshipStatus(userId, friends.data, requests.data);
  const target = encodeURIComponent(userId);

  const mutation = useMutation({
    mutationFn: async (action: "add" | "cancel" | "remove") => {
      if (action === "remove") {
        await friendsFetch(`/v2/users/me/friends/${target}`, "DELETE");
        return "removed" as const;
      }
      if (action === "cancel") {
        await friendsFetch(`/v2/users/me/friend-requests/${target}`, "DELETE");
        return "canceled" as const;
      }
      // Sending to someone who already asked you accepts their request.
      const res = await friendsFetch<{ status: "pending" | "accepted" }>(
        `/v2/users/me/friend-requests/${target}`,
        "PUT",
      );
      return res.status;
    },
    onSuccess: (result) => {
      toast.success(
        {
          pending: "Friend request sent",
          accepted: "You're now friends",
          canceled:
            status === "incoming"
              ? "Friend request declined"
              : "Friend request canceled",
          removed: "Friend removed",
        }[result],
      );
    },
    onError: (error) => toast.error(error.message),
    // Stale state (e.g. they accepted meanwhile) gets fixed by the refetch.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
      void queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_KEY });
    },
  });

  return {
    status,
    isLoading: friends.isPending || requests.isPending,
    isMutating: mutation.isPending,
    add: () => mutation.mutate("add"),
    cancel: () => mutation.mutate("cancel"),
    remove: () => mutation.mutate("remove"),
  };
}
