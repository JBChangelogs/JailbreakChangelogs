"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Message } from "@/utils/messages/types";
import { asId } from "@/utils/messages/parsing";

interface UseMessageNavigationScrollOptions {
  pathname: string;
  selectedUserId: string | null;
  setSelectedUserId: Dispatch<SetStateAction<string | null>>;
  messages: Message[];
  currentUserId: string | null;
  isLoadingMessages: boolean;
}

export function useMessageNavigationScroll({
  pathname,
  selectedUserId,
  setSelectedUserId,
  messages,
  currentUserId,
  isLoadingMessages,
}: UseMessageNavigationScrollOptions) {
  const getConversationIdFromPathname = (path: string): string | null => {
    if (!path.startsWith("/messages")) return null;
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    try {
      const decoded = decodeURIComponent(parts[1] ?? "").trim();
      return decoded || null;
    } catch {
      return null;
    }
  };

  const [routeConversationId, setRouteConversationId] = useState<string | null>(
    () => getConversationIdFromPathname(pathname),
  );
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [newMessagesStartId, setNewMessagesStartId] = useState<string | null>(
    null,
  );

  const selectedUserIdRef = useRef<string | null>(null);
  const routeConversationIdRef = useRef<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const prependScrollRestoreRef = useRef<{
    conversationId: string;
    prevScrollTop: number;
    prevScrollHeight: number;
  } | null>(null);
  const pendingOwnSendScrollRef = useRef(false);
  const initialScrollConversationIdRef = useRef<string | null>(null);
  const isAtBottomRef = useRef(true);
  const pendingRealtimeReadUserIdsRef = useRef<Set<string>>(new Set());
  const latestRenderedMessageRef = useRef<{
    conversationId: string;
    messageId: string;
    seenBadgeMessageId: string | null;
  } | null>(null);

  const scrollMessagesToLatest = useCallback((behavior: ScrollBehavior) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const scroll = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      isAtBottomRef.current = true;
    };

    // Double RAF helps when switching conversations because layout/paint can
    // occur after state updates land, especially with large message lists.
    requestAnimationFrame(() => {
      scroll();
      requestAnimationFrame(scroll);
    });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom <= 48;
    if (isAtBottomRef.current) {
      setHasNewMessagesBelow(false);
      const userId = selectedUserId;
      if (userId && pendingRealtimeReadUserIdsRef.current.delete(userId)) {
        window.dispatchEvent(
          new CustomEvent("sendRealtimeMarkRead", {
            detail: { sender_id: userId },
          }),
        );
      }
    }
  }, [selectedUserId]);

  const showNewMessages = useCallback(() => {
    setHasNewMessagesBelow(false);
    const container = messagesContainerRef.current;
    const divider = container?.querySelector<HTMLElement>(
      "[data-new-messages-divider]",
    );

    if (!container || !divider) {
      scrollMessagesToLatest("smooth");
      return;
    }

    container.scrollTo({
      top: Math.max(0, divider.offsetTop - 16),
      behavior: "smooth",
    });
  }, [scrollMessagesToLatest]);

  useEffect(() => {
    const idFromPath = getConversationIdFromPathname(pathname);
    setRouteConversationId(idFromPath);
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const idFromPath =
        parts.length >= 2 ? decodeURIComponent(parts[1]).trim() : "";
      const nextRouteId = idFromPath || null;
      setRouteConversationId(nextRouteId);
      setSelectedUserId(nextRouteId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setSelectedUserId]);

  useEffect(() => {
    setSelectedUserId(routeConversationId);
  }, [routeConversationId, setSelectedUserId]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    routeConversationIdRef.current = routeConversationId;
  }, [routeConversationId]);

  useEffect(() => {
    if (!pendingOwnSendScrollRef.current) {
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.type === "system" || !currentUserId) {
      return;
    }

    if (asId(latestMessage.senderId) !== currentUserId) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    scrollMessagesToLatest("smooth");
    pendingOwnSendScrollRef.current = false;
  }, [messages, currentUserId, scrollMessagesToLatest]);

  useEffect(() => {
    initialScrollConversationIdRef.current = null;
    latestRenderedMessageRef.current = null;
    isAtBottomRef.current = true;
    setHasNewMessagesBelow(false);
    setNewMessagesStartId(null);
  }, [selectedUserId]);

  useLayoutEffect(() => {
    if (!selectedUserId || isLoadingMessages || messages.length === 0) {
      return;
    }

    if (initialScrollConversationIdRef.current === selectedUserId) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    initialScrollConversationIdRef.current = selectedUserId;
    scrollMessagesToLatest("auto");
  }, [
    isLoadingMessages,
    messages.length,
    scrollMessagesToLatest,
    selectedUserId,
  ]);

  useLayoutEffect(() => {
    if (!selectedUserId || isLoadingMessages || messages.length === 0) {
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    const previous = latestRenderedMessageRef.current;
    const latestUserMessage = messages.findLast(
      (message) => message.type !== "system",
    );
    const seenBadgeMessageId =
      latestUserMessage &&
      asId(latestUserMessage.senderId) === currentUserId &&
      typeof latestUserMessage.readAt === "number" &&
      latestUserMessage.status !== "pending" &&
      latestUserMessage.status !== "failed"
        ? latestUserMessage.id
        : null;
    latestRenderedMessageRef.current = {
      conversationId: selectedUserId,
      messageId: latestMessage.id,
      seenBadgeMessageId,
    };

    const hasNewLatestMessage =
      previous?.conversationId === selectedUserId &&
      previous.messageId !== latestMessage.id;
    const hasSeenBadgeAppeared =
      previous?.conversationId === selectedUserId &&
      !previous.seenBadgeMessageId &&
      !!seenBadgeMessageId;

    // Keep new messages and read receipts pinned only when already at the bottom.
    if (
      (hasNewLatestMessage || hasSeenBadgeAppeared) &&
      isAtBottomRef.current &&
      !prependScrollRestoreRef.current
    ) {
      setHasNewMessagesBelow(false);
      scrollMessagesToLatest("auto");
    } else if (
      hasNewLatestMessage &&
      latestMessage.type !== "system" &&
      asId(latestMessage.senderId) !== currentUserId
    ) {
      setHasNewMessagesBelow(true);
      setNewMessagesStartId((current) =>
        current && messages.some((message) => message.id === current)
          ? current
          : latestMessage.id,
      );
    }
  }, [
    currentUserId,
    isLoadingMessages,
    messages,
    scrollMessagesToLatest,
    selectedUserId,
  ]);

  useLayoutEffect(() => {
    const restore = prependScrollRestoreRef.current;
    if (!restore) return;
    if (!selectedUserId || restore.conversationId !== selectedUserId) {
      prependScrollRestoreRef.current = null;
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      prependScrollRestoreRef.current = null;
      return;
    }

    const delta = container.scrollHeight - restore.prevScrollHeight;
    container.scrollTop = restore.prevScrollTop + delta;
    prependScrollRestoreRef.current = null;
  }, [messages, selectedUserId]);

  return {
    routeConversationId,
    setRouteConversationId,
    selectedUserIdRef,
    routeConversationIdRef,
    messagesContainerRef,
    handleMessagesScroll,
    hasNewMessagesBelow,
    newMessagesStartId,
    showNewMessages,
    prependScrollRestoreRef,
    pendingOwnSendScrollRef,
    isAtBottomRef,
    pendingRealtimeReadUserIdsRef,
  };
}
