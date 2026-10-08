"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  skipToken,
  type InfiniteData,
} from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import { Chat } from "@/components/chat/chat";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { ChatEventTime } from "@/components/chat/chat-event";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useAuthContext } from "@/contexts/AuthContext";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { useEmojiStringMap } from "@/hooks/useEmojiStringMap";
import {
  prepareEmojiShortcodeContentForApi,
  prepareEmojiShortcodeDisplayContent,
} from "@/utils/comments/emojiShortcodes";
import { useTwemoji } from "@/contexts/TwemojiContext";
import { MessageRow } from "@/components/Users/Messages/MessageRow";
import { ActiveOfferReminder } from "@/components/Users/Messages/ActiveOfferReminder";
import { ChatHeaderPanel } from "@/components/Users/Messages/ChatHeaderPanel";
import { ComposerFooter } from "@/components/Users/Messages/ComposerFooter";
import { ConversationSidebar } from "@/components/Users/Messages/ConversationSidebar";
import { NewConversationModal } from "@/components/Users/Messages/NewConversationModal";
import { useMessagesRealtime } from "@/hooks/useMessagesRealtime";
import {
  useConversationList,
  type ConversationListData,
} from "@/hooks/useConversationList";
import {
  useMessageThread,
  type MessageThreadPage,
} from "@/hooks/useMessageThread";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useMessageMutations } from "@/hooks/useMessageMutations";
import { useOfferDetailsBatch } from "@/hooks/useOfferDetailsBatch";
import { useMessageBlocking } from "@/hooks/useMessageBlocking";
import { useLocalMessageOverlay } from "@/hooks/useLocalMessageOverlay";
import { useMessageNavigationScroll } from "@/hooks/useMessageNavigationScroll";
import { useUserSearch } from "@/hooks/useUserSearch";
import type {
  ConversationSummary,
  Message,
  MessageUser,
  RealtimeMessageEventDetail,
} from "@/utils/messages/types";
import { asId, parseOfferAcceptedMetadata } from "@/utils/messages/parsing";
import { formatMessageText, getDisplayName } from "@/utils/messages/formatting";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  getMessageDomId,
  sortConversationsByLatestMessage,
} from "@/utils/messages/sorting";

const HIDDEN_CONVERSATION_UNDO_MS = 8000;

function blockedUserMap(data: unknown): Record<string, boolean> {
  const entries =
    data && typeof data === "object" && "blocked_users" in data
      ? data.blocked_users
      : null;
  return Object.fromEntries(
    (Array.isArray(entries) ? entries : []).flatMap((entry: unknown) => {
      if (!entry || typeof entry !== "object" || !("blocked_user_id" in entry))
        return [];
      const id = entry.blocked_user_id;
      return typeof id === "string" || typeof id === "number"
        ? [[String(id), true]]
        : [];
    }),
  );
}

export default function MessagesInbox() {
  const pathname = usePathname();
  const router = useRouter();

  useLockBodyScroll(true);

  const {
    user: currentUser,
    isAuthenticated,
    isLoading,
    setLoginModal,
    bans,
    setBan,
  } = useAuthContext();
  const messageBan = bans["communication"] ?? null;
  const emojiStringMap = useEmojiStringMap();
  const { twemojiEnabled } = useTwemoji();

  const prepareMessageContentForApi = useCallback(
    (text: string) =>
      sanitizeText(prepareEmojiShortcodeContentForApi(text.trim())),
    [],
  );

  /** Mirror backend emoji rendering in optimistic/local UI only. */
  const prepareMessageDisplayContent = useCallback(
    (text: string) =>
      sanitizeText(prepareEmojiShortcodeDisplayContent(text, emojiStringMap)),
    [emojiStringMap],
  );

  const queryClient = useQueryClient();
  const currentUserId = currentUser ? asId(currentUser.id) : null;
  const conversationKey = useMemo(
    () => ["conversation-list", currentUserId],
    [currentUserId],
  );
  const conversationQuery = useQuery<ConversationListData>({
    queryKey: conversationKey,
    queryFn: skipToken,
    gcTime: 0,
    retry: false,
  });
  const conversations = useMemo(
    () => conversationQuery.data?.items ?? [],
    [conversationQuery.data?.items],
  );
  const totalConversations = conversationQuery.data?.total ?? null;
  const isLoadingConversations =
    isAuthenticated && conversationQuery.isFetching;
  const setConversations = useCallback<
    Dispatch<SetStateAction<ConversationSummary[]>>
  >(
    (update) => {
      queryClient.setQueryData<ConversationListData>(
        conversationKey,
        (previous) => {
          const current = previous ?? { items: [], total: null };
          return {
            ...current,
            items:
              typeof update === "function" ? update(current.items) : update,
          };
        },
      );
    },
    [queryClient, conversationKey],
  );
  const setTotalConversations = useCallback<
    Dispatch<SetStateAction<number | null>>
  >(
    (update) => {
      queryClient.setQueryData<ConversationListData>(
        conversationKey,
        (previous) => {
          const current = previous ?? { items: [], total: null };
          return {
            ...current,
            total:
              typeof update === "function" ? update(current.total) : update,
          };
        },
      );
    },
    [queryClient, conversationKey],
  );
  const [recentlyHiddenConversations, setRecentlyHiddenConversations] =
    useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const threadKey = useMemo(
    () => ["message-thread", currentUserId, selectedUserId],
    [currentUserId, selectedUserId],
  );
  const threadQuery = useInfiniteQuery<MessageThreadPage>({
    queryKey: threadKey,
    queryFn: skipToken,
    initialPageParam: 1,
    getNextPageParam: (last, _pages, lastPageParam) => {
      const page = last.pagination.page ?? Number(lastPageParam);
      return last.pagination.totalPages != null &&
        page < last.pagination.totalPages
        ? page + 1
        : undefined;
    },
    gcTime: 0,
    retry: false,
  });
  const messages = useMemo(() => {
    const byId = new Map<string, Message>();
    for (const page of threadQuery.data?.pages ?? [])
      for (const message of page.messages)
        if (!byId.has(message.id)) byId.set(message.id, message);
    return [...byId.values()].sort(
      (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
    );
  }, [threadQuery.data]);
  const setMessages = useCallback<Dispatch<SetStateAction<Message[]>>>(
    (update) => {
      if (!currentUserId || !selectedUserId) return;
      queryClient.setQueryData<InfiniteData<MessageThreadPage>>(
        threadKey,
        (previous) => {
          const current = previous ?? {
            pages: [
              { messages: [], pagination: { page: 1, totalPages: null } },
            ],
            pageParams: [1],
          };
          const existing = new Map<string, Message>();
          for (const page of current.pages)
            for (const message of page.messages)
              if (!existing.has(message.id)) existing.set(message.id, message);
          const ordered = [...existing.values()].sort(
            (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
          );
          const next = typeof update === "function" ? update(ordered) : update;
          const byId = new Map(next.map((message) => [message.id, message]));
          const added = next.filter((message) => !existing.has(message.id));
          return {
            ...current,
            pages: current.pages.map((page, index) => ({
              ...page,
              messages: [
                ...page.messages.flatMap((message) => {
                  const updated = byId.get(message.id);
                  return updated ? [updated] : [];
                }),
                ...(index === 0 ? added : []),
              ],
            })),
          };
        },
      );
    },
    [queryClient, threadKey, currentUserId, selectedUserId],
  );
  const isLoadingMessages = Boolean(
    isAuthenticated && selectedUserId && threadQuery.isLoading,
  );
  const isLoadingOlderMessages = threadQuery.isFetchingNextPage;
  const messagesPage =
    threadQuery.data?.pages.at(-1)?.pagination.page ??
    Number(threadQuery.data?.pageParams.at(-1) ?? 1);
  const messagesTotalPages =
    threadQuery.data?.pages.at(-1)?.pagination.totalPages ?? null;
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editEmojiOpen, setEditEmojiOpen] = useState(false);
  const editCursorPosRef = useRef<number | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [reportingMessage, setReportingMessage] = useState<Message | null>(
    null,
  );
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null,
  );
  const [conversationListRefreshKey, setConversationListRefreshKey] =
    useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isUnmessageable, setIsUnmessageable] = useState(false);
  const blockedKey = useMemo(
    () => ["blocked-users", currentUserId],
    [currentUserId],
  );
  const blockedQuery = useQuery<{
    blocked_users?: Array<{ blocked_user_id: string | number }>;
  } | null>({
    queryKey: blockedKey,
    queryFn: skipToken,
    gcTime: 0,
    retry: false,
  });
  const blockedByMeByUserId = useMemo(
    () => blockedUserMap(blockedQuery.data),
    [blockedQuery.data],
  );
  const setBlockedByMeByUserId = useCallback<
    Dispatch<SetStateAction<Record<string, boolean>>>
  >(
    (update) => {
      queryClient.setQueryData<{
        blocked_users?: Array<{ blocked_user_id: string | number }>;
      }>(blockedKey, (previous) => {
        const current = blockedUserMap(previous);
        const next = typeof update === "function" ? update(current) : update;
        return {
          ...previous,
          blocked_users: Object.entries(next)
            .filter(([, blocked]) => blocked)
            .map(([id]) => ({ blocked_user_id: id })),
        };
      });
    },
    [queryClient, blockedKey],
  );
  const currentUserQuery = useQuery<MessageUser | null>({
    queryKey: ["message-current-user", currentUserId],
    queryFn: skipToken,
    gcTime: 0,
    retry: false,
  });
  const currentUserEnriched = currentUserQuery.data ?? null;
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const userSearchInputRef = useRef<HTMLInputElement | null>(null);
  const messagesPageRef = useRef(1);
  const messagesTotalPagesRef = useRef<number | null>(null);
  const isLoadingOlderMessagesRef = useRef(false);
  const hideConversationRequestsRef = useRef<Map<string, Promise<boolean>>>(
    new Map(),
  );
  const hiddenConversationUndoTimeoutsRef = useRef<Map<string, number>>(
    new Map(),
  );

  useEffect(() => {
    const undoTimeouts = hiddenConversationUndoTimeoutsRef.current;
    return () => {
      for (const timeoutId of undoTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }
      undoTimeouts.clear();
    };
  }, []);

  const {
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
  } = useMessageNavigationScroll({
    pathname,
    selectedUserId,
    setSelectedUserId,
    messages,
    currentUserId: currentUser ? asId(currentUser.id) : null,
    isLoadingMessages,
  });

  useEffect(() => {
    messagesPageRef.current = messagesPage;
  }, [messagesPage]);

  useEffect(() => {
    messagesTotalPagesRef.current = messagesTotalPages;
  }, [messagesTotalPages]);

  useEffect(() => {
    isLoadingOlderMessagesRef.current = isLoadingOlderMessages;
  }, [isLoadingOlderMessages]);

  useEffect(() => {
    setActiveMessageId(null);
  }, [selectedUserId]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-message-row]")) return;
      setActiveMessageId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);
  const readMessageIdsRef = useRef<Set<string>>(new Set());
  const typingSentAtByUserIdRef = useRef<Map<string, number>>(new Map());

  const insertEditEmoji = useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = editCursorPosRef.current ?? editContent.length;
      const next =
        editContent.slice(0, cursor) + emoji + editContent.slice(cursor);
      setEditContent(next);
      editCursorPosRef.current = cursor + emoji.length;
      if (!keepOpen) {
        setEditEmojiOpen(false);
        requestAnimationFrame(() => {
          const el = editTextareaRef.current;
          if (!el) return;
          el.focus();
          const pos = editCursorPosRef.current ?? next.length;
          el.setSelectionRange(pos, pos);
        });
      }
    },
    [editContent],
  );

  const {
    localThreadMessagesByUserIdRef,
    upsertLocalThreadMessage,
    updateLocalThreadMessage,
    removeLocalThreadMessage,
  } = useLocalMessageOverlay();

  const { typingUserIds } = useMessagesRealtime({
    currentUserId: currentUser ? asId(currentUser.id) : null,
    isAuthenticated,
    selectedUserIdRef,
    readMessageIdsRef,
    isAtBottomRef,
    pendingRealtimeReadUserIdsRef,
    localThreadMessagesByUserIdRef,
    updateLocalThreadMessage,
    upsertLocalThreadMessage,
    removeLocalThreadMessage,
    setMessages,
    setConversations,
    setReplyingToMessage,
  });

  const handleTyping = useCallback(() => {
    if (!selectedUserId) return;
    const now = Date.now();
    const lastSent = typingSentAtByUserIdRef.current.get(selectedUserId) ?? 0;
    if (now - lastSent < 3000) return;
    typingSentAtByUserIdRef.current.set(selectedUserId, now);
    window.dispatchEvent(
      new CustomEvent("sendRealtimeTyping", {
        detail: { recipient_id: selectedUserId },
      }),
    );
  }, [selectedUserId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.user.id === selectedUserId,
      ),
    [conversations, selectedUserId],
  );

  const currentUserMessageUser = useMemo<MessageUser | null>(() => {
    if (!currentUser) return null;

    return {
      id: asId(currentUser.id),
      username: currentUser.username,
      global_name: currentUser.global_name,
      avatar: currentUser.avatar,
      banner: currentUser.banner,
      custom_banner: currentUser.custom_banner ?? null,
      accent_color: currentUser.accent_color ?? null,
      usernumber: currentUser.usernumber,
      flags: currentUser.flags,
      primary_guild: currentUser.primary_guild,
      premiumtype: currentUser.premiumtype,
      presence: currentUser.presence,
      last_seen: currentUser.last_seen,
      settings: currentUser.settings,
    };
  }, [currentUser]);

  const selectedUser = selectedConversation?.user ?? null;
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    const handleRealtimeConversation = (event: Event) => {
      const detail = (event as CustomEvent<RealtimeMessageEventDetail>).detail;
      if (
        (detail?.action !== "message_received" &&
          detail?.action !== "message_sent") ||
        !detail.data ||
        typeof detail.data.user_id !== "string" ||
        typeof detail.data.recipient_id !== "string"
      ) {
        return;
      }

      const senderId = detail.data.user_id;
      const recipientId = detail.data.recipient_id;
      if (senderId !== currentUserId && recipientId !== currentUserId) return;

      const counterpartId = senderId === currentUserId ? recipientId : senderId;
      if (
        conversations.some(
          (conversation) => conversation.user.id === counterpartId,
        )
      ) {
        return;
      }

      setConversationListRefreshKey((key) => key + 1);
    };

    window.addEventListener("realtimeMessage", handleRealtimeConversation);
    return () => {
      window.removeEventListener("realtimeMessage", handleRealtimeConversation);
    };
  }, [conversations, currentUserId, isAuthenticated]);

  const acceptedOffers = useMemo(
    () =>
      messages
        .map((message) => parseOfferAcceptedMetadata(message.metadata))
        .filter((metadata) => metadata !== null),
    [messages],
  );
  const offerDetails = useOfferDetailsBatch(acceptedOffers);
  const lastSeenTime = useOptimizedRealTimeRelativeDate(
    selectedUser?.last_seen,
    `messages-last-seen-${selectedUser?.id ?? "none"}`,
  );

  const shouldHidePresence =
    selectedUser?.settings_v2?.hide_presence === true &&
    currentUser?.id !== selectedUser?.id;
  const isTargetOnline =
    !!selectedUser &&
    !shouldHidePresence &&
    selectedUser.presence?.status === "Online";
  const selectedUserBlockedByMe =
    !!selectedUser?.id && blockedByMeByUserId[selectedUser.id] === true;

  useConversationList({
    isAuthenticated,
    currentUserId,
    currentUserMessageUser,
    selectedUserId,
    routeConversationId,
    routeConversationIdRef,
    conversations,
    setConversations,
    setSelectedUserId,
    refreshKey: conversationListRefreshKey,
  });
  const { results: userSearchResults, isLoading: isUserSearchLoading } =
    useUserSearch(userSearchQuery, currentUserId);
  useMessageThread({
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
  });
  const { handleBlockToggle, isProcessingBlockAction } = useMessageBlocking({
    setBlockedByMeByUserId,
  });
  const selectConversation = (id: string) => {
    setSelectedUserId(id);
    setRouteConversationId(id);
    window.history.pushState({}, "", `/messages/${encodeURIComponent(id)}`);
  };

  const goToConversationList = () => {
    setSelectedUserId(null);
    setRouteConversationId(null);
    setMessages([]);
    window.history.pushState({}, "", "/messages");
  };

  const showHiddenConversationUndo = (
    hiddenConversations: ConversationSummary[],
  ) => {
    setRecentlyHiddenConversations((prev) => {
      const nextByUserId = new Map(
        prev.map((conversation) => [conversation.user.id, conversation]),
      );
      for (const conversation of hiddenConversations) {
        nextByUserId.set(conversation.user.id, conversation);
      }
      return [...nextByUserId.values()];
    });

    for (const conversation of hiddenConversations) {
      const userId = conversation.user.id;
      const existingTimeout =
        hiddenConversationUndoTimeoutsRef.current.get(userId);
      if (existingTimeout !== undefined) {
        window.clearTimeout(existingTimeout);
      }
      const timeoutId = window.setTimeout(() => {
        hiddenConversationUndoTimeoutsRef.current.delete(userId);
        setRecentlyHiddenConversations((prev) =>
          prev.filter((item) => item.user.id !== userId),
        );
      }, HIDDEN_CONVERSATION_UNDO_MS);
      hiddenConversationUndoTimeoutsRef.current.set(userId, timeoutId);
    }
  };

  const dismissHiddenConversationUndo = (userId: string) => {
    const timeoutId = hiddenConversationUndoTimeoutsRef.current.get(userId);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      hiddenConversationUndoTimeoutsRef.current.delete(userId);
    }
    setRecentlyHiddenConversations((prev) =>
      prev.filter((item) => item.user.id !== userId),
    );
  };

  const restoreHiddenConversations = (
    hiddenConversations: ConversationSummary[],
  ) => {
    if (hiddenConversations.length === 0) return;
    setConversations((prev) => {
      const existingIds = new Set(prev.map((item) => item.user.id));
      const missing = hiddenConversations.filter(
        (item) => !existingIds.has(item.user.id),
      );
      return missing.length > 0
        ? sortConversationsByLatestMessage([...prev, ...missing])
        : prev;
    });
    setTotalConversations((prev) =>
      prev === null ? null : prev + hiddenConversations.length,
    );
  };

  const hideConversation = async (conversation: ConversationSummary) => {
    const userId = conversation.user.id;
    setConversations((prev) => prev.filter((item) => item.user.id !== userId));
    setTotalConversations((prev) =>
      prev === null ? null : Math.max(0, prev - 1),
    );

    if (selectedUserId === userId) {
      goToConversationList();
    }

    showHiddenConversationUndo([conversation]);

    const hideRequest = (async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Public API URL is not configured");
        }

        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          `/v2/conversations/${encodeURIComponent(userId)}/hidden`,
        );
        const response = await fetch(url, {
          method: "PUT",
          credentials: "include",
          headers,
        });

        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(
              response,
              "Failed to hide conversation",
            ),
          );
        }
        return true;
      } catch (error) {
        restoreHiddenConversations([conversation]);
        dismissHiddenConversationUndo(userId);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to hide conversation",
        );
        return false;
      }
    })();

    hideConversationRequestsRef.current.set(userId, hideRequest);
    await hideRequest;
    if (hideConversationRequestsRef.current.get(userId) === hideRequest) {
      hideConversationRequestsRef.current.delete(userId);
    }
  };

  const unhideRecentlyHiddenConversation = async (
    conversation: ConversationSummary,
  ) => {
    const userId = conversation.user.id;
    dismissHiddenConversationUndo(userId);

    const pendingHide = hideConversationRequestsRef.current.get(userId);
    const hideSucceeded = pendingHide ? await pendingHide : true;
    if (!hideSucceeded) return;

    restoreHiddenConversations([conversation]);

    try {
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/conversations/${encodeURIComponent(userId)}/hidden`,
      );
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(
            response,
            "Failed to unhide conversation",
          ),
        );
      }
    } catch (error) {
      setConversations((prev) =>
        prev.filter((item) => item.user.id !== userId),
      );
      setTotalConversations((prev) =>
        prev === null ? null : Math.max(0, prev - 1),
      );
      showHiddenConversationUndo([conversation]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to unhide conversation",
      );
    }
  };

  const { handleSendMessage, handleSendGift } = useSendMessage({
    selectedUserId,
    selectedUser,
    currentUser,
    replyingToMessage,
    isSending,
    selectedUserIdRef,
    pendingOwnSendScrollRef,
    readMessageIdsRef,
    prepareMessageContentForApi,
    prepareMessageDisplayContent,
    setIsSending,
    setMessages,
    setConversations,
    setReplyingToMessage,
    setBan,
    upsertLocalThreadMessage,
    updateLocalThreadMessage,
  });
  const {
    handleEditMessage,
    handleDeleteMessage,
    handleRetryFailedMessage,
    handleReportMessage,
  } = useMessageMutations({
    selectedUserId,
    messages,
    conversations,
    editContent,
    isSending,
    reportingMessage,
    reportReason,
    deletingMessageId,
    localThreadMessagesByUserIdRef,
    prepareMessageContentForApi,
    prepareMessageDisplayContent,
    handleSendMessage,
    setIsSending,
    setMessages,
    setConversations,
    setEditingMessageId,
    setEditContent,
    setDeletingMessageId,
    setReplyingToMessage,
    setReportingMessage,
    setReportReason,
    setIsSubmittingReport,
    setBan,
    updateLocalThreadMessage,
    removeLocalThreadMessage,
  });
  if (isLoading) {
    return (
      <div data-messages-shell className="h-full overflow-hidden px-4 pb-4">
        <div className="flex h-full min-h-0 flex-col">
          <Breadcrumb loading={true} containerClassName="py-4" />
          <div className="border-border-card bg-secondary-bg mt-0 flex min-h-0 flex-1 items-center justify-center rounded-lg border shadow-md">
            <p className="text-secondary-text text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div data-messages-shell className="h-full overflow-hidden px-4 pb-4">
        <div className="flex h-full min-h-0 flex-col">
          <Breadcrumb containerClassName="py-4" />
          <div className="border-border-card bg-secondary-bg mt-0 flex min-h-0 w-full flex-1 items-center justify-center rounded-lg border p-6 shadow-md sm:p-8">
            <div className="text-center">
              <h1 className="page-heading">Direct Messages</h1>
              <p className="text-secondary-text mt-2 text-sm">
                Login to view your conversations and send messages.
              </p>
              <div className="mt-4">
                <Button onClick={() => setLoginModal({ open: true })}>
                  Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const messagePlaceholder = selectedUser
    ? `Message ${getDisplayName(selectedUser)}...`
    : "Select a conversation to start messaging.";

  return (
    <div data-messages-shell className="h-full overflow-hidden">
      <div className="flex h-full min-h-0 flex-col">
        <Breadcrumb containerClassName="px-4 py-4" />

        <div className="bg-secondary-bg border-border-card mx-4 mt-0 grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-lg border lg:grid-cols-[320px_1fr]">
          <ConversationSidebar
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            isUserSearchLoading={isUserSearchLoading}
            userSearchResults={userSearchResults}
            totalConversations={totalConversations}
            conversations={conversations}
            typingUserIds={typingUserIds}
            selectedUserId={selectedUserId}
            currentUserId={currentUserId}
            isLoadingConversations={isLoadingConversations}
            isAuthenticated={isAuthenticated}
            twemojiEnabled={twemojiEnabled}
            recentlyHiddenConversations={recentlyHiddenConversations}
            userSearchInputRef={userSearchInputRef}
            selectConversation={selectConversation}
            hideConversation={(conversation) =>
              void hideConversation(conversation)
            }
            unhideRecentlyHiddenConversation={(conversation) =>
              void unhideRecentlyHiddenConversation(conversation)
            }
          />

          <section
            className={cn(
              "min-h-0",
              selectedUserId ? "block" : "hidden lg:block",
            )}
          >
            {!selectedUser ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="text-center">
                  <div className="border-border-card bg-tertiary-bg/40 mx-auto flex h-24 w-24 items-center justify-center rounded-full border shadow-sm">
                    <Icon
                      icon="heroicons:paper-airplane"
                      className="text-secondary-text h-10 w-10"
                    />
                  </div>
                  <h2 className="text-primary-text mt-5 text-lg font-semibold">
                    Your messages
                  </h2>
                  <p className="text-secondary-text mt-1 text-sm">
                    Search for a user to start a chat.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <Button onClick={() => setNewConversationOpen(true)}>
                      Start a conversation
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Chat className="h-full min-h-0">
                <ChatHeaderPanel
                  selectedUser={selectedUser}
                  currentUserId={currentUserId}
                  isTargetOnline={isTargetOnline}
                  shouldHidePresence={shouldHidePresence}
                  lastSeenTime={lastSeenTime}
                  selectedUserBlockedByMe={selectedUserBlockedByMe}
                  isProcessingBlockAction={isProcessingBlockAction}
                  goToConversationList={goToConversationList}
                  onViewProfile={() =>
                    router.push(`/users/${encodeURIComponent(selectedUser.id)}`)
                  }
                  onToggleBlock={() =>
                    void handleBlockToggle(
                      selectedUser.id,
                      !selectedUserBlockedByMe,
                    )
                  }
                />

                <ActiveOfferReminder
                  messages={messages}
                  offerDetails={offerDetails}
                  onViewOffer={(message) => {
                    const container = messagesContainerRef.current;
                    const target = document.getElementById(
                      `message-${getMessageDomId(message)}`,
                    );
                    if (!container || !target || !container.contains(target))
                      return;
                    container.scrollTo({
                      top: Math.max(
                        0,
                        target.getBoundingClientRect().top -
                          container.getBoundingClientRect().top +
                          container.scrollTop -
                          16,
                      ),
                      behavior: "smooth",
                    });
                  }}
                />

                <ChatMessages
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="bg-secondary-bg relative !flex-col px-2 py-3 sm:px-4"
                  style={{ overflowAnchor: "none" }}
                >
                  {!isLoadingMessages &&
                    isLoadingOlderMessages &&
                    messages.length > 0 && (
                      <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
                        <div className="bg-tertiary-bg border-border-card text-secondary-text flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                          <Spinner className="h-3 w-3" />
                          Loading older messages
                        </div>
                      </div>
                    )}
                  {isLoadingMessages ? (
                    <div className="mx-auto my-auto flex flex-col items-center justify-center px-6 py-8 text-center">
                      <div className="border-border-card bg-tertiary-bg/40 flex h-14 w-14 items-center justify-center rounded-full border">
                        <Spinner className="h-6 w-6" />
                      </div>
                      <p className="text-secondary-text mt-3 text-sm">
                        Loading messages…
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="mx-auto my-auto w-full max-w-md px-4">
                      <div className="text-center">
                        <div className="border-border-card bg-tertiary-bg/40 mx-auto flex h-20 w-20 items-center justify-center rounded-full border shadow-sm">
                          <Icon
                            icon="ic:baseline-message"
                            className="text-secondary-text h-9 w-9"
                            inline={true}
                          />
                        </div>
                        <h3 className="text-primary-text mt-4 text-base font-semibold">
                          No messages yet
                        </h3>
                        <p className="text-secondary-text mt-1 text-sm">
                          Say hi to start the conversation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <Fragment key={message.id}>
                        {message.id === newMessagesStartId && (
                          <div
                            data-new-messages-divider
                            role="separator"
                            aria-label="New messages"
                            className="flex items-center gap-2 py-2"
                          >
                            <span className="border-status-error flex-1 border-t" />
                            <span className="text-status-error min-w-max text-xs font-semibold">
                              New messages
                            </span>
                            <span className="border-status-error flex-1 border-t" />
                          </div>
                        )}
                        <MessageRow
                          message={message}
                          offerDetails={offerDetails}
                          index={index}
                          messages={messages}
                          currentUser={currentUser}
                          currentUserEnriched={currentUserEnriched}
                          currentUserMessageUser={currentUserMessageUser}
                          selectedUser={selectedUser}
                          activeMessageId={activeMessageId}
                          editingMessageId={editingMessageId}
                          editContent={editContent}
                          editEmojiOpen={editEmojiOpen}
                          emojiStringMap={emojiStringMap}
                          twemojiEnabled={twemojiEnabled}
                          isSending={isSending}
                          deletingMessageId={deletingMessageId}
                          editCursorPosRef={editCursorPosRef}
                          editTextareaRef={editTextareaRef}
                          messagesContainerRef={messagesContainerRef}
                          setActiveMessageId={setActiveMessageId}
                          setEditingMessageId={setEditingMessageId}
                          setEditContent={setEditContent}
                          setEditEmojiOpen={setEditEmojiOpen}
                          setReplyingToMessage={setReplyingToMessage}
                          setReportingMessage={setReportingMessage}
                          setReportReason={setReportReason}
                          handleDeleteMessage={handleDeleteMessage}
                          handleRetryFailedMessage={handleRetryFailedMessage}
                          handleEditMessage={handleEditMessage}
                          insertEditEmoji={insertEditEmoji}
                        />
                      </Fragment>
                    ))
                  )}
                </ChatMessages>

                {hasNewMessagesBelow && (
                  <div className="pointer-events-none relative z-20 h-0">
                    <Button
                      type="button"
                      size="sm"
                      className="pointer-events-auto absolute right-1/2 bottom-3 translate-x-1/2 rounded-full shadow-lg"
                      onClick={showNewMessages}
                    >
                      <Icon icon="heroicons:arrow-down" className="h-4 w-4" />
                      New messages
                    </Button>
                  </div>
                )}

                <ComposerFooter
                  messageBan={messageBan}
                  replyingToMessage={replyingToMessage}
                  setReplyingToMessage={setReplyingToMessage}
                  currentUser={currentUser}
                  currentUserEnriched={currentUserEnriched}
                  currentUserMessageUser={currentUserMessageUser}
                  selectedUser={selectedUser}
                  selectedUserId={selectedUserId}
                  messagePlaceholder={messagePlaceholder}
                  isSending={isSending}
                  isUnmessageable={isUnmessageable}
                  isTyping={typingUserIds.has(selectedUser.id)}
                  onSend={handleSendMessage}
                  onSendGift={handleSendGift}
                  onTyping={handleTyping}
                />
              </Chat>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        onConfirm={() =>
          deletingMessageId && void handleDeleteMessage(deletingMessageId, true)
        }
        title="Delete Message"
        confirmText="Delete"
        confirmVariant="destructive"
      >
        <div className="space-y-2">
          <p className="text-secondary-text">
            Are you sure you want to delete this message? This action cannot be
            undone.
          </p>
          <p className="text-secondary-text text-xs">
            Tip: Hold <span className="font-semibold">Shift</span> while
            clicking <span className="font-semibold">Delete Message</span> to
            skip this confirmation.
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!reportingMessage}
        onClose={() => {
          setReportingMessage(null);
          setReportReason("");
        }}
        onConfirm={() => void handleReportMessage()}
        title="Report Message"
        confirmText="Submit Report"
        confirmVariant="destructive"
        confirmDisabled={!reportReason.trim() || isSubmittingReport}
        closeOnConfirm={false}
      >
        <div className="space-y-3">
          {reportingMessage && selectedUser && (
            <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <UserAvatar
                    userId={selectedUser.id}
                    avatarHash={selectedUser.avatar}
                    username={selectedUser.username}
                    custom_avatar={selectedUser.custom_avatar}
                    size={7}
                    showBadge={false}
                    settings={selectedUser.settings_v2}
                    premiumType={selectedUser.premiumtype}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-primary-text text-sm font-medium">
                      {getDisplayName(selectedUser)}
                    </span>
                    {typeof reportingMessage.createdAt === "number" && (
                      <ChatEventTime
                        timestamp={reportingMessage.createdAt}
                        format="discord"
                        className="text-secondary-text text-xs"
                      />
                    )}
                  </div>
                  <p className="text-primary-text/80 mt-0.5 line-clamp-4 text-sm break-words">
                    {formatMessageText(reportingMessage.content)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-secondary-text text-sm">
            Please describe why you are reporting this message.
          </p>
          <div>
            <textarea
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              placeholder="Explain why you're reporting this message..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reportReason.length >= 500 ? "text-form-error" : "text-secondary-text"}`}
            >
              {reportReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>

      <NewConversationModal
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        currentUserId={currentUserId}
        onSelectUser={(id) => {
          setNewConversationOpen(false);
          selectConversation(id);
        }}
      />
    </div>
  );
}
