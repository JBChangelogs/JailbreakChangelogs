"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useEffect, useLayoutEffect } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import type { Message } from "@/utils/messages/types";
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
  setMessagesPage: Setter<number>;
  setMessagesTotalPages: Setter<number | null>;
  setIsLoadingMessages: Setter<boolean>;
  setIsLoadingOlderMessages: Setter<boolean>;
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
  setMessagesPage,
  setMessagesTotalPages,
  setIsLoadingMessages,
  setIsLoadingOlderMessages,
  setIsUnmessageable,
  upsertLocalThreadMessage,
}: UseMessageThreadOptions) {
  const fetchMessagesPage = useCallback(
    async (userId: string, page: number) => {
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const pageParam = page > 1 ? `?page=${page}` : "";
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(userId)}${pageParam}`,
      );
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers,
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to load messages"),
        );
      }

      const rawBody = await response.text();
      const parsed = rawBody ? (JSON.parse(rawBody) as unknown) : null;
      const items = extractItems(parsed);
      const pagination = extractPagination(parsed);

      // API returns newest → oldest; UI expects oldest → newest.
      const parsedMessages = items
        .map((item) => parseMessageRecord(item))
        .filter((item): item is Message => Boolean(item))
        .reverse();
      return { messages: parsedMessages, pagination };
    },
    [],
  );

  const loadOlderMessages = useCallback(async () => {
    if (!selectedUserId) return;
    if (isLoadingMessages || isLoadingOlderMessagesRef.current) return;
    const totalPages = messagesTotalPagesRef.current;
    const currentPage = messagesPageRef.current;
    if (totalPages === null) return;
    if (currentPage >= totalPages) return;

    const container = messagesContainerRef.current;
    if (!container) return;
    setIsLoadingOlderMessages(true);
    try {
      const nextPage = currentPage + 1;
      // Prevent duplicate loads firing before state updates flush.
      messagesPageRef.current = nextPage;
      const { messages: serverMessages, pagination } = await fetchMessagesPage(
        selectedUserId,
        nextPage,
      );

      const resolvedPage = pagination.page ?? nextPage;
      const resolvedTotalPages = pagination.totalPages ?? totalPages;
      messagesPageRef.current = resolvedPage;
      messagesTotalPagesRef.current = resolvedTotalPages;
      setMessagesPage(resolvedPage);
      setMessagesTotalPages(resolvedTotalPages);

      // Discord-style: keep current viewport anchored while older messages prepend.
      prependScrollRestoreRef.current = {
        conversationId: selectedUserId,
        prevScrollTop: container.scrollTop,
        prevScrollHeight: container.scrollHeight,
      };
      setMessages((prev) => {
        const prevIds = new Set(prev.map((m) => m.id));
        const unique = serverMessages.filter((m) => !prevIds.has(m.id));
        return unique.length > 0 ? [...unique, ...prev] : prev;
      });
    } catch (error) {
      messagesPageRef.current = currentPage;
      log.error("Error loading older messages:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load older messages",
      );
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [
    fetchMessagesPage,
    isLoadingMessages,
    isLoadingOlderMessagesRef,
    messagesContainerRef,
    messagesPageRef,
    messagesTotalPagesRef,
    prependScrollRestoreRef,
    selectedUserId,
    setIsLoadingOlderMessages,
    setMessages,
    setMessagesPage,
    setMessagesTotalPages,
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
    if (!selectedUserId || !isAuthenticated || !currentUserId) {
      setMessages([]);
      setIsLoadingMessages(false);
      setMessagesPage(1);
      setMessagesTotalPages(null);
      setIsLoadingOlderMessages(false);
      messagesPageRef.current = 1;
      messagesTotalPagesRef.current = null;
      return;
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setMessages([]);
        setMessagesPage(1);
        setMessagesTotalPages(null);
        setIsLoadingOlderMessages(false);

        const { messages: parsedMessages, pagination } =
          await fetchMessagesPage(selectedUserId, 1);

        if (!isCancelled) {
          const resolvedPage = pagination.page ?? 1;
          const resolvedTotalPages = pagination.totalPages ?? null;
          messagesPageRef.current = resolvedPage;
          messagesTotalPagesRef.current = resolvedTotalPages;
          setMessagesPage(resolvedPage);
          setMessagesTotalPages(resolvedTotalPages);
          const local =
            localThreadMessagesByUserIdRef.current.get(selectedUserId) ?? [];
          const serverIds = new Set(parsedMessages.map((m) => m.id));
          const merged = [
            ...parsedMessages,
            ...local.filter((m) => !serverIds.has(m.id)),
          ].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
          setMessages(merged);
        }
      } catch (error) {
        if (!isCancelled) {
          log.error("Error fetching messages:", error);
          setMessages([]);
          toast.error(
            error instanceof Error ? error.message : "Failed to load messages",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      }
    };

    void fetchMessages();

    return () => {
      isCancelled = true;
    };
  }, [
    currentUserId,
    fetchMessagesPage,
    isAuthenticated,
    localThreadMessagesByUserIdRef,
    messagesPageRef,
    messagesTotalPagesRef,
    selectedUserId,
    setIsLoadingMessages,
    setIsLoadingOlderMessages,
    setIsUnmessageable,
    setMessages,
    setMessagesPage,
    setMessagesTotalPages,
  ]);

  useEffect(() => {
    if (
      !selectedUserId ||
      !isAuthenticated ||
      !currentUserId ||
      !PUBLIC_API_URL
    )
      return;

    let isCancelled = false;

    const checkEligibility = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          `/messages/${encodeURIComponent(selectedUserId)}`,
        );
        const response = await fetch(url, {
          method: "HEAD",
          credentials: "include",
          headers,
        });

        if (isCancelled) return;

        if (response.status === 403) {
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
          setMessages((prev) => {
            if (prev.some((m) => m.id === systemMessage.id)) return prev;
            return sortMessagesByCreatedAt([...prev, systemMessage]);
          });
        }
      } catch (error) {
        log.error("Error checking messaging eligibility:", error);
      }
    };

    void checkEligibility();

    return () => {
      isCancelled = true;
    };
  }, [
    currentUserId,
    isAuthenticated,
    selectedUserId,
    setIsUnmessageable,
    setMessages,
    upsertLocalThreadMessage,
  ]);
}
