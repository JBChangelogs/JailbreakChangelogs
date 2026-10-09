"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import type {
  ConversationSummary,
  Message,
  MessageUser,
} from "@/utils/messages/types";
import {
  asNumber,
  extractItems,
  parseMessageRecord,
  toMessageUser,
} from "@/utils/messages/parsing";
import { hasAvatarSettingsData } from "@/utils/messages/formatting";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";

const log = createLogger("UI");
type Setter<T> = Dispatch<SetStateAction<T>>;

export interface ConversationListData {
  items: ConversationSummary[];
  total: number | null;
}

function mergeUserWithLatestPresence(
  current: MessageUser,
  incoming: MessageUser,
): MessageUser {
  const currentPresenceUpdated = current.presence?.last_updated ?? -1;
  const incomingPresenceUpdated = incoming.presence?.last_updated ?? -1;
  const currentPresenceIsNewer =
    currentPresenceUpdated > incomingPresenceUpdated;

  return {
    ...current,
    ...incoming,
    ...(currentPresenceIsNewer
      ? {
          presence: current.presence,
          last_seen: current.last_seen,
        }
      : {}),
  };
}

const USER_LOOKUP_FIELDS = [
  "id",
  "username",
  "global_name",
  "avatar",
  "banner",
  "custom_avatar",
  "custom_banner",
  "accent_color",
  "usernumber",
  "premiumtype",
  "settings",
  "presence",
  "last_seen",
  "flags",
  "primary_guild",
].join(",");

interface UseConversationListOptions {
  isAuthenticated: boolean;
  currentUserId: string | null;
  currentUserMessageUser: MessageUser | null;
  selectedUserId: string | null;
  routeConversationId: string | null;
  routeConversationIdRef: RefObject<string | null>;
  conversations: ConversationSummary[];
  setConversations: Setter<ConversationSummary[]>;
  setSelectedUserId: Setter<string | null>;
  refreshKey: number;
}

export function useConversationList({
  isAuthenticated,
  currentUserId,
  currentUserMessageUser,
  selectedUserId,
  routeConversationId,
  routeConversationIdRef,
  conversations,
  setConversations,
  setSelectedUserId,
  refreshKey,
}: UseConversationListOptions) {
  const queryClient = useQueryClient();
  const [routeUserError, setRouteUserError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const loadUserById = useCallback(
    async (
      id: string,
      options?: { forceRefresh?: boolean },
    ): Promise<MessageUser | null> => {
      if (!PUBLIC_API_URL) throw new Error("Public API URL is not configured");
      const queryKey = ["message-user-lookup", id, USER_LOOKUP_FIELDS];
      const cached = queryClient.getQueryData<MessageUser | null>(queryKey);
      try {
        return await queryClient.fetchQuery({
          queryKey,
          queryFn: async ({ signal }): Promise<MessageUser | null> => {
            const { url, headers } = buildApiFetchRequest(
              PUBLIC_API_URL,
              `/v2/users/${encodeURIComponent(id)}?fields=${USER_LOOKUP_FIELDS}`,
            );
            const response = await fetch(url, {
              method: "GET",
              cache: "no-store",
              headers,
              signal,
            });
            if (!response.ok)
              throw new Error(
                await getResponseErrorMessage(
                  response,
                  "Unable to load user details.",
                ),
              );
            return toMessageUser(await response.json());
          },
          staleTime:
            options?.forceRefresh || !hasAvatarSettingsData(cached)
              ? 0
              : 5 * 60_000,
          gcTime: 30 * 60_000,
          retry: false,
        });
      } catch (error) {
        log.error("Error loading user by id:", error);
        throw error;
      }
    },
    [queryClient],
  );

  const loadUsersBatch = useCallback(
    async (ids: string[]): Promise<Map<string, MessageUser>> => {
      const result = new Map<string, MessageUser>();
      if (ids.length === 0 || !PUBLIC_API_URL) {
        return result;
      }

      try {
        const data = await queryClient.fetchQuery({
          queryKey: ["message-users-batch", [...ids].sort()],
          queryFn: async ({ signal }): Promise<unknown> => {
            const { url, headers } = buildApiFetchRequest(
              PUBLIC_API_URL,
              `/v2/users/batch?ids=${ids.map(encodeURIComponent).join(",")}`,
            );
            const response = await fetch(url, {
              method: "GET",
              cache: "no-store",
              headers,
              signal,
            });
            if (!response.ok)
              throw new Error(
                await getResponseErrorMessage(
                  response,
                  "Unable to load conversation users.",
                ),
              );
            return response.json();
          },
          staleTime: 5 * 60_000,
          gcTime: 30 * 60_000,
          retry: false,
        });
        if (!Array.isArray(data)) {
          return result;
        }

        for (const raw of data) {
          const user = toMessageUser(raw);
          if (user) {
            queryClient.setQueryData(
              ["message-user-lookup", user.id, USER_LOOKUP_FIELDS],
              user,
            );
            result.set(user.id, user);
          }
        }
      } catch (error) {
        log.error("Error loading users batch:", error);
        throw error;
      }

      return result;
    },
    [queryClient],
  );

  useQuery({
    queryKey: ["message-current-user", currentUserId],
    enabled: isAuthenticated && !!currentUserMessageUser,
    queryFn: async () => {
      if (!currentUserMessageUser) return null;
      const loaded = await loadUserById(currentUserMessageUser.id, {
        forceRefresh: true,
      });
      return { ...currentUserMessageUser, ...loaded };
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const conversationListQuery = useQuery({
    queryKey: ["conversation-list", currentUserId],
    enabled: isAuthenticated && !!currentUserId,
    queryFn: async ({ signal }): Promise<ConversationListData> => {
      if (!PUBLIC_API_URL) throw new Error("Public API URL is not configured");
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/v2/conversations",
      );
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers,
        signal,
      });
      if (!response.ok)
        throw new Error(
          await getResponseErrorMessage(
            response,
            "Failed to load conversations",
          ),
        );
      const rawBody = await response.text();
      const parsed = rawBody ? parseJsonWithLargeIds(rawBody) : null;
      const items = extractItems(parsed);
      const parsedTotalConversations =
        parsed && typeof parsed === "object"
          ? (parsed as { total_conversations?: unknown }).total_conversations
          : null;
      const totalConversationsValue =
        typeof parsedTotalConversations === "number"
          ? parsedTotalConversations
          : null;

      const groupedConversations = new Map<string, Message>();
      const messageCountByUserId = new Map<string, number>();
      const unreadCountByUserId = new Map<string, number>();
      const userHints = new Map<string, MessageUser>();

      for (const item of items) {
        const record = item as Record<string, unknown>;
        const message = parseMessageRecord(item);

        const directUser =
          toMessageUser(record.user) ||
          toMessageUser(record.target_user) ||
          toMessageUser(record.recipient) ||
          toMessageUser(record.other_user);

        if (directUser && directUser.id !== currentUserId) {
          userHints.set(directUser.id, directUser);
        }

        if (!message) continue;

        const otherId =
          message.senderId === currentUserId
            ? message.receiverId
            : message.senderId;

        const recordMessageCount = record.message_count;
        if (typeof recordMessageCount === "number") {
          messageCountByUserId.set(otherId, recordMessageCount);
        }

        const recordUnreadCount = asNumber(record.unread_count);
        if (recordUnreadCount !== null) {
          unreadCountByUserId.set(otherId, Math.max(0, recordUnreadCount));
        }

        const existing = groupedConversations.get(otherId);
        if (!existing || (message.createdAt ?? 0) > (existing.createdAt ?? 0)) {
          groupedConversations.set(otherId, message);
        }
      }

      const allUserIds = Array.from(groupedConversations.keys());
      const missingUserIds = allUserIds.filter((id) => {
        const hinted = userHints.get(id);
        return !hinted || !hasAvatarSettingsData(hinted);
      });
      const loadedUsers = await loadUsersBatch(missingUserIds);

      missingUserIds.forEach((id) => {
        const loaded = loadedUsers.get(id);
        if (loaded) {
          const previous = userHints.get(id);
          userHints.set(id, {
            ...(previous ?? {}),
            ...loaded,
          });
        }
      });

      const summaries: ConversationSummary[] = [];
      for (const id of allUserIds) {
        const user = userHints.get(id);
        if (!user) continue;
        summaries.push({
          user,
          lastMessage: groupedConversations.get(id),
          messageCount: messageCountByUserId.get(id),
          unreadCount: unreadCountByUserId.get(id),
        });
      }
      summaries.sort(
        (a, b) =>
          (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
      );

      const previous = queryClient.getQueryData<ConversationListData>([
        "conversation-list",
        currentUserId,
      ]);
      return {
        items: summaries.map((summary) => {
          const current = previous?.items.find(
            (conversation) => conversation.user.id === summary.user.id,
          );
          return current
            ? {
                ...summary,
                user: mergeUserWithLatestPresence(current.user, summary.user),
              }
            : summary;
        }),
        total: totalConversationsValue,
      };
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const previousRefreshKeyRef = useRef(refreshKey);
  useEffect(() => {
    if (previousRefreshKeyRef.current === refreshKey) return;
    previousRefreshKeyRef.current = refreshKey;
    void queryClient.invalidateQueries({
      queryKey: ["conversation-list", currentUserId],
    });
  }, [refreshKey, currentUserId, queryClient]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      setSelectedUserId(routeConversationIdRef.current);
      return;
    }
    if (!conversationListQuery.isSuccess) return;
    setSelectedUserId((previous) =>
      previous &&
      (conversationListQuery.data.items.some(
        (summary) => summary.user.id === previous,
      ) ||
        previous === routeConversationIdRef.current)
        ? previous
        : null,
    );
  }, [
    isAuthenticated,
    currentUserId,
    conversationListQuery.isSuccess,
    conversationListQuery.data,
    routeConversationIdRef,
    setSelectedUserId,
  ]);
  useEffect(() => {
    if (!conversationListQuery.error) return;
    log.error("Error fetching conversations:", conversationListQuery.error);
    toast.error(conversationListQuery.error.message);
  }, [conversationListQuery.error, conversationListQuery.errorUpdatedAt]);

  const blockedUsersQuery = useQuery({
    queryKey: ["blocked-users", currentUserId],
    enabled: isAuthenticated && !!currentUserId && !!selectedUserId,
    queryFn: async ({ signal }): Promise<unknown> => {
      if (!PUBLIC_API_URL) throw new Error("Public API URL is not configured");
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
        throw new Error(
          await getResponseErrorMessage(
            response,
            "Failed to fetch blocked users",
          ),
        );
      }
      const rawBody = await response.text();
      return rawBody ? parseJsonWithLargeIds(rawBody) : null;
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (blockedUsersQuery.error)
      log.error("Error fetching blocked users:", blockedUsersQuery.error);
  }, [blockedUsersQuery.error]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !currentUserId ||
      !routeConversationId ||
      !conversationListQuery.isFetched
    ) {
      return;
    }

    const exists = conversations.some(
      (conversation) => conversation.user.id === routeConversationId,
    );
    if (exists) {
      setRouteUserError(null);
      setSelectedUserId(routeConversationId);
      return;
    }

    let isCancelled = false;
    const ensureRouteConversationUser = async () => {
      let loadedUser: MessageUser | null;
      try {
        loadedUser = await loadUserById(routeConversationId);
      } catch (error) {
        if (!isCancelled)
          setRouteUserError({
            id: routeConversationId,
            message:
              error instanceof Error
                ? error.message
                : "Unable to load user details.",
          });
        return;
      }
      if (isCancelled) return;
      if (!loadedUser) {
        setRouteUserError({
          id: routeConversationId,
          message: "This user could not be found.",
        });
        return;
      }
      setRouteUserError(null);

      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (conversation) => conversation.user.id === loadedUser.id,
        );
        if (existingIndex === -1) {
          return [{ user: loadedUser }, ...prev];
        }

        return prev.map((conversation, index) =>
          index === existingIndex
            ? {
                ...conversation,
                user: mergeUserWithLatestPresence(
                  conversation.user,
                  loadedUser,
                ),
              }
            : conversation,
        );
      });
    };

    void ensureRouteConversationUser();

    return () => {
      isCancelled = true;
    };
  }, [
    conversations,
    currentUserId,
    isAuthenticated,
    loadUserById,
    conversationListQuery.isFetched,
    routeConversationId,
    setConversations,
    setSelectedUserId,
  ]);
  return { routeUserError };
}
