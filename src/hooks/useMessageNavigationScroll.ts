"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  const scrollMessagesToLatest = (behavior: ScrollBehavior) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const scroll = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    };

    // Double RAF helps when switching conversations because layout/paint can
    // occur after state updates land, especially with large message lists.
    requestAnimationFrame(() => {
      scroll();
      requestAnimationFrame(scroll);
    });
  };

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
  }, [messages, currentUserId]);

  useEffect(() => {
    initialScrollConversationIdRef.current = null;
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
  }, [isLoadingMessages, messages.length, selectedUserId]);

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
    prependScrollRestoreRef,
    pendingOwnSendScrollRef,
  };
}
