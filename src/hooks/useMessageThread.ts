"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useQuery,
  replaceEqualDeep,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import type { ConversationSummary, Message } from "@/utils/messages/types";
import {
  extractItems,
  extractPagination,
  parseMessageRecord,
} from "@/utils/messages/parsing";
import { sortMessagesByCreatedAt } from "@/utils/messages/sorting";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

const log = createLogger("UI");
type Setter<T> = Dispatch<SetStateAction<T>>;

export interface MessageThreadPage {
  messages: Message[];
  pagination: Pick<
    ReturnType<typeof extractPagination>,
    "page" | "totalPages"
  > &
    Partial<Pick<ReturnType<typeof extractPagination>, "total" | "size">>;
}

interface UseMessageThreadOptions {
  selectedUserId: string | null;
  currentUserId: string | null;
  isAuthenticated: boolean;
  isLoadingMessages: boolean;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  messagesPageRef: RefObject<number>;
  messagesTotalPagesRef: RefObject<number | null>;
  isLoadingOlderMessagesRef: RefObject<boolean>;
  prependScrollRestoreRef: RefObject<{
    conversationId: string;
    prevScrollTop: number;
    prevScrollHeight: number;
  } | null>;
  localThreadMessagesByUserIdRef: RefObject<Map<string, Message[]>>;
  setMessages: Setter<Message[]>;
  setConversations: Setter<ConversationSummary[]>;
  setIsUnmessageable: Setter<boolean>;
  upsertLocalThreadMessage: (userId: string, message: Message) => void;
}

export function useMessageThread({
  selectedUserId,
  currentUserId,
  isAuthenticated,
  isLoadingMessages,
  messagesContainerRef,
  messagesPageRef,
  messagesTotalPagesRef,
  isLoadingOlderMessagesRef,
  prependScrollRestoreRef,
  localThreadMessagesByUserIdRef,
  setMessages,
  setConversations,
  setIsUnmessageable,
  upsertLocalThreadMessage,
}: UseMessageThreadOptions) {
  const pendingPrependPositionRef =
    useRef<typeof prependScrollRestoreRef.current>(null);
  const messagesQuery = useInfiniteQuery({
    queryKey: ["message-thread", currentUserId, selectedUserId],
    enabled: isAuthenticated && !!currentUserId && !!selectedUserId,
    initialPageParam: 1,
    queryFn: async ({ signal, pageParam }): Promise<MessageThreadPage> => {
      if (!PUBLIC_API_URL) throw new Error("Public API URL is not configured");
      const pageParamSuffix = pageParam > 1 ? `?page=${pageParam}` : "";
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/conversations/${encodeURIComponent(selectedUserId!)}/messages${pageParamSuffix}`,
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
          await getResponseErrorMessage(response, "Failed to load messages"),
        );
      const rawBody = await response.text();
      const parsed = rawBody ? (JSON.parse(rawBody) as unknown) : null;
      const pagination = extractPagination(parsed);
      const messages = extractItems(parsed)
        .map(parseMessageRecord)
        .filter((message): message is Message => !!message)
        .reverse();
      if (pageParam === 1 && selectedUserId) {
        const local =
          localThreadMessagesByUserIdRef.current.get(selectedUserId) ?? [];
        const ids = new Set(messages.map((message) => message.id));
        messages.push(...local.filter((message) => !ids.has(message.id)));
        messages.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      }
      if (
        pageParam > 1 &&
        !signal.aborted &&
        pendingPrependPositionRef.current?.conversationId === selectedUserId
      ) {
        prependScrollRestoreRef.current = pendingPrependPositionRef.current;
        pendingPrependPositionRef.current = null;
      }
      return { messages, pagination };
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const page = lastPage.pagination.page ?? lastPageParam;
      const totalPages = lastPage.pagination.totalPages;
      return totalPages !== null && page < totalPages ? page + 1 : undefined;
    },
    structuralSharing: (previousData, nextData) => {
      const previous = previousData as
        | InfiniteData<MessageThreadPage>
        | undefined;
      const next = nextData as InfiniteData<MessageThreadPage>;
      // Keep realtime edits made while an older-page request was in flight.
      return replaceEqualDeep(
        previous,
        previous && next.pages.length > previous.pages.length
          ? {
              ...next,
              pages: [
                ...previous.pages,
                ...next.pages.slice(previous.pages.length),
              ],
            }
          : next,
      );
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const lastPage = messagesQuery.data?.pages.at(-1);
  const lastPageParam = messagesQuery.data?.pageParams.at(-1);
  messagesPageRef.current =
    lastPage?.pagination.page ??
    (typeof lastPageParam === "number" ? lastPageParam : 1);
  messagesTotalPagesRef.current = lastPage?.pagination.totalPages ?? null;
  isLoadingOlderMessagesRef.current = messagesQuery.isFetchingNextPage;
  const selectedUserIdRef = useRef(selectedUserId);
  selectedUserIdRef.current = selectedUserId;
  const { fetchNextPage, hasNextPage } = messagesQuery;
  const loadOlderMessages = useCallback(async () => {
    if (
      !selectedUserId ||
      isLoadingMessages ||
      isLoadingOlderMessagesRef.current ||
      !hasNextPage
    )
      return;
    const container = messagesContainerRef.current;
    if (!container) return;
    const previousPosition = {
      conversationId: selectedUserId,
      prevScrollTop: container.scrollTop,
      prevScrollHeight: container.scrollHeight,
    };
    isLoadingOlderMessagesRef.current = true;
    pendingPrependPositionRef.current = previousPosition;
    const result = await fetchNextPage({ cancelRefetch: false });
    if (selectedUserIdRef.current !== selectedUserId) return;
    if (result.isError) {
      pendingPrependPositionRef.current = null;
      log.error("Error loading older messages:", result.error);
      toast.error(result.error?.message ?? "Failed to load older messages");
    }
  }, [
    isLoadingMessages,
    isLoadingOlderMessagesRef,
    messagesContainerRef,
    hasNextPage,
    fetchNextPage,
    selectedUserId,
  ]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (!selectedUserId) return;
    if (isLoadingMessages) return;

    const onScroll = () => {
      if (isLoadingOlderMessagesRef.current) return;
      const totalPages = messagesTotalPagesRef.current;
      const currentPage = messagesPageRef.current;
      if (totalPages === null) return;
      if (currentPage >= totalPages) return;
      if (container.scrollTop <= 120) {
        void loadOlderMessages();
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [
    isLoadingMessages,
    isLoadingOlderMessagesRef,
    loadOlderMessages,
    messagesContainerRef,
    messagesPageRef,
    messagesTotalPagesRef,
    selectedUserId,
  ]);

  useLayoutEffect(() => {
    setIsUnmessageable(false);
  }, [selectedUserId, currentUserId, isAuthenticated, setIsUnmessageable]);
  const initialPage = messagesQuery.data?.pages[0];
  useEffect(() => {
    if (
      !selectedUserId ||
      !initialPage ||
      !messagesQuery.isSuccess ||
      messagesQuery.isFetching
    )
      return;
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.user.id === selectedUserId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
    window.dispatchEvent(new CustomEvent("messageThreadRead"));
  }, [
    initialPage,
    messagesQuery.isSuccess,
    messagesQuery.isFetching,
    selectedUserId,
    setConversations,
  ]);
  useEffect(() => {
    if (!messagesQuery.error || messagesQuery.isFetchNextPageError) return;
    log.error("Error fetching messages:", messagesQuery.error);
    toast.error(messagesQuery.error.message);
  }, [
    messagesQuery.error,
    messagesQuery.errorUpdatedAt,
    messagesQuery.isFetchNextPageError,
  ]);

  const eligibilityQuery = useQuery({
    queryKey: ["message-eligibility", currentUserId, selectedUserId],
    enabled:
      isAuthenticated &&
      !!currentUserId &&
      !!selectedUserId &&
      !!PUBLIC_API_URL,
    queryFn: async ({ signal }) => {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/conversations/${encodeURIComponent(selectedUserId!)}`,
      );
      const response = await fetch(url, {
        method: "HEAD",
        credentials: "include",
        headers,
        signal,
      });
      return response.status;
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (eligibilityQuery.data !== 403 || !selectedUserId) return;
    setIsUnmessageable(true);
    const systemContent = "You are not allowed to message this user.";
    toast.error(systemContent);
    const systemMessage: Message = {
      id: `system-unmessageable-${selectedUserId}`,
      senderId: "system",
      receiverId: selectedUserId,
      content: systemContent,
      createdAt: Date.now(),
      type: "system",
    };
    upsertLocalThreadMessage(selectedUserId, systemMessage);
    setMessages((previous) =>
      previous.some((message) => message.id === systemMessage.id)
        ? previous
        : sortMessagesByCreatedAt([...previous, systemMessage]),
    );
  }, [
    eligibilityQuery.data,
    selectedUserId,
    setIsUnmessageable,
    setMessages,
    upsertLocalThreadMessage,
  ]);
  useEffect(() => {
    if (eligibilityQuery.error)
      log.error(
        "Error checking messaging eligibility:",
        eligibilityQuery.error,
      );
  }, [eligibilityQuery.error]);
}
