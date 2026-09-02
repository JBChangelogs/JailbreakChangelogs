"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import type { UserData } from "@/types/auth";
import type {
  ConversationSummary,
  Message,
  MessageUser,
} from "@/utils/messages/types";
import {
  asId,
  extractItems,
  parseMessageRecord,
  toMessageUser,
} from "@/utils/messages/parsing";
import { hasAvatarSettingsData } from "@/utils/messages/formatting";
import {
  PUBLIC_API_URL,
  getResponseErrorMessage,
  searchUsers,
} from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";

const log = createLogger("UI");
type Setter<T> = Dispatch<SetStateAction<T>>;

interface UseConversationListOptions {
  isAuthenticated: boolean;
  currentUserId: string | null;
  currentUserMessageUser: MessageUser | null;
  selectedUserId: string | null;
  routeConversationId: string | null;
  routeConversationIdRef: RefObject<string | null>;
  conversations: ConversationSummary[];
  userSearchQuery: string;
  setConversations: Setter<ConversationSummary[]>;
  setTotalConversations: Setter<number | null>;
  setSelectedUserId: Setter<string | null>;
  setIsLoadingConversations: Setter<boolean>;
  setBlockedByMeByUserId: Setter<Record<string, boolean>>;
  setCurrentUserEnriched: Setter<MessageUser | null>;
  setUserSearchResults: Setter<UserData[]>;
  setIsUserSearchLoading: Setter<boolean>;
}

export function useConversationList({
  isAuthenticated,
  currentUserId,
  currentUserMessageUser,
  selectedUserId,
  routeConversationId,
  routeConversationIdRef,
  conversations,
  userSearchQuery,
  setConversations,
  setTotalConversations,
  setSelectedUserId,
  setIsLoadingConversations,
  setBlockedByMeByUserId,
  setCurrentUserEnriched,
  setUserSearchResults,
  setIsUserSearchLoading,
}: UseConversationListOptions) {
  const userLookupCacheRef = useRef<Map<string, MessageUser | null>>(new Map());
  const userLookupPendingRef = useRef<Map<string, Promise<MessageUser | null>>>(
    new Map(),
  );
  const userSearchRequestIdRef = useRef(0);

  const loadUserById = async (
    id: string,
    options?: { forceRefresh?: boolean },
  ): Promise<MessageUser | null> => {
    const forceRefresh = options?.forceRefresh === true;
    if (!forceRefresh && userLookupCacheRef.current.has(id)) {
      const cached = userLookupCacheRef.current.get(id) ?? null;
      if (hasAvatarSettingsData(cached)) {
        return cached;
      }
    }

    const pending = userLookupPendingRef.current.get(id);
    if (pending) {
      return pending;
    }

    const request = (async () => {
      try {
        const response = await fetch(
          `/api/users/get?id=${encodeURIComponent(id)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return toMessageUser(data);
      } catch (error) {
        log.error("Error loading user by id:", error);
        return null;
      } finally {
        userLookupPendingRef.current.delete(id);
      }
    })();

    userLookupPendingRef.current.set(id, request);
    const result = await request;
    userLookupCacheRef.current.set(id, result);
    return result;
  };

  useEffect(() => {
    if (!isAuthenticated || !currentUserMessageUser) {
      setCurrentUserEnriched(null);
      return;
    }

    let isCancelled = false;
    setCurrentUserEnriched(currentUserMessageUser);

    const prefetchCurrentUser = async () => {
      const loaded = await loadUserById(currentUserMessageUser.id, {
        forceRefresh: true,
      });

      if (!loaded || isCancelled) return;

      setCurrentUserEnriched((prev) => {
        if (prev && prev.id === currentUserMessageUser.id) {
          return { ...prev, ...loaded };
        }
        return { ...currentUserMessageUser, ...loaded };
      });
    };

    void prefetchCurrentUser();

    return () => {
      isCancelled = true;
    };
  }, [currentUserMessageUser, isAuthenticated, setCurrentUserEnriched]);

  useEffect(() => {
    const trimmedQuery = userSearchQuery.trim();
    if (!trimmedQuery) {
      userSearchRequestIdRef.current += 1;
      setUserSearchResults([]);
      setIsUserSearchLoading(false);
      return;
    }

    const requestId = (userSearchRequestIdRef.current += 1);
    setIsUserSearchLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const resultsRaw = await searchUsers(trimmedQuery, 100);
        if (userSearchRequestIdRef.current !== requestId) return;

        const results = Array.isArray(resultsRaw) ? resultsRaw : [];
        setUserSearchResults(
          currentUserId
            ? results.filter((result) => result?.id !== currentUserId)
            : results,
        );
      } catch (error) {
        if (userSearchRequestIdRef.current !== requestId) return;
        log.error("Error searching users:", error);
        setUserSearchResults([]);
      } finally {
        if (userSearchRequestIdRef.current === requestId) {
          setIsUserSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentUserId,
    setIsUserSearchLoading,
    setUserSearchResults,
    userSearchQuery,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      setConversations([]);
      setTotalConversations(null);
      setSelectedUserId(null);
      return;
    }

    let isCancelled = false;

    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        if (!PUBLIC_API_URL) {
          throw new Error("Public API URL is not configured");
        }

        const { url: convUrl, headers: convHeaders } = buildApiFetchRequest(
          PUBLIC_API_URL,
          "/messages?nocache=true",
        );
        const response = await fetch(convUrl, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: convHeaders,
        });

        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(
              response,
              "Failed to load conversations",
            ),
          );
        }

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

          const existing = groupedConversations.get(otherId);
          if (
            !existing ||
            (message.createdAt ?? 0) > (existing.createdAt ?? 0)
          ) {
            groupedConversations.set(otherId, message);
          }
        }

        const allUserIds = Array.from(groupedConversations.keys());
        const missingUserIds = allUserIds.filter((id) => {
          const hinted = userHints.get(id);
          return !hinted || !hasAvatarSettingsData(hinted);
        });
        const loadedUsers = await Promise.all(
          missingUserIds.map((id) => loadUserById(id)),
        );

        missingUserIds.forEach((id, index) => {
          const loaded = loadedUsers[index];
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
          });
        }
        summaries.sort(
          (a, b) =>
            (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
        );

        if (isCancelled) return;

        setConversations(summaries);
        setTotalConversations(totalConversationsValue);

        setSelectedUserId((prev) => {
          if (prev && summaries.some((summary) => summary.user.id === prev)) {
            return prev;
          }
          // Keep the selection if it matches the current route — ensureRouteConversationUser
          // will add the user to conversations. Nulling it out here causes a null→restore
          // cycle that makes every selectedUserId-dependent effect fire twice.
          if (prev && prev === routeConversationIdRef.current) {
            return prev;
          }
          return null;
        });
      } catch (error) {
        if (isCancelled) return;
        log.error("Error fetching conversations:", error);
        setConversations([]);
        setTotalConversations(null);
        setSelectedUserId(null);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load conversations",
        );
      } finally {
        setIsLoadingConversations(false);
      }
    };

    void fetchConversations();

    return () => {
      isCancelled = true;
    };
  }, [
    currentUserId,
    isAuthenticated,
    routeConversationIdRef,
    setConversations,
    setIsLoadingConversations,
    setSelectedUserId,
    setTotalConversations,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId || !selectedUserId) {
      setBlockedByMeByUserId({});
      return;
    }

    let isCancelled = false;

    const fetchBlockedUsers = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Public API URL is not configured");
        }

        const { url: blockedUrl, headers: blockedHeaders } =
          buildApiFetchRequest(PUBLIC_API_URL, "/messages/blocked");
        const response = await fetch(blockedUrl, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: blockedHeaders,
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

        const nextMap: Record<string, boolean> = {};
        for (const item of blockedUsers) {
          if (!item || typeof item !== "object") continue;
          const record = item as Record<string, unknown>;
          const blockedUserId = record.blocked_user_id;
          if (
            typeof blockedUserId === "string" ||
            typeof blockedUserId === "number"
          ) {
            nextMap[asId(blockedUserId)] = true;
          }
        }

        if (!isCancelled) {
          setBlockedByMeByUserId(nextMap);
        }
      } catch (error) {
        if (!isCancelled) {
          log.error("Error fetching blocked users:", error);
          setBlockedByMeByUserId({});
        }
      }
    };

    void fetchBlockedUsers();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, isAuthenticated, selectedUserId, setBlockedByMeByUserId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId || !routeConversationId) {
      return;
    }

    const exists = conversations.some(
      (conversation) => conversation.user.id === routeConversationId,
    );
    if (exists) {
      setSelectedUserId(routeConversationId);
      return;
    }

    let isCancelled = false;
    const ensureRouteConversationUser = async () => {
      const loadedUser = await loadUserById(routeConversationId);
      if (!loadedUser || isCancelled) return;

      setConversations((prev) => {
        if (
          prev.some((conversation) => conversation.user.id === loadedUser.id)
        ) {
          return prev;
        }
        return [{ user: loadedUser }, ...prev];
      });
      setSelectedUserId(routeConversationId);
    };

    void ensureRouteConversationUser();

    return () => {
      isCancelled = true;
    };
  }, [
    conversations,
    currentUserId,
    isAuthenticated,
    routeConversationId,
    setConversations,
    setSelectedUserId,
  ]);
}
