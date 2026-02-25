"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/utils/avatar";
import { cn } from "@/lib/utils";
import { Chat } from "@/components/chat/chat";
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import {
  ChatToolbar,
  ChatToolbarAddon,
  ChatToolbarButton,
  ChatToolbarTextarea,
} from "@/components/chat/chat-toolbar";
import {
  ChatEvent,
  ChatEventAddon,
  ChatEventBody,
  ChatEventContent,
  ChatEventTime,
  ChatEventTitle,
} from "@/components/chat/chat-event";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { useAuthContext } from "@/contexts/AuthContext";
import { PUBLIC_API_URL } from "@/utils/api";
import type { UserFlag, UserSettings } from "@/types/auth";

type MessageUser = {
  id: string;
  username: string;
  global_name?: string;
  avatar: string;
  banner?: string | null;
  custom_banner?: string | null;
  accent_color?: string | null;
  usernumber?: number;
  custom_avatar?: string;
  flags?: UserFlag[];
  primary_guild?: {
    tag: string | null;
    badge: string | null;
    identity_enabled: boolean;
    identity_guild_id: string | null;
  } | null;
  premiumtype?: number;
  presence?: {
    status: "Online" | "Offline";
    last_updated: number;
  };
  last_seen?: number | null;
  settings?: {
    avatar_discord: number;
    hide_presence?: number;
  } & Partial<UserSettings>;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: number;
};

type ConversationSummary = {
  user: MessageUser;
  lastMessage?: Message;
};

type ApiSendResponse = {
  success: boolean;
  message: {
    id: string;
    user_id: string;
    recipient_id: string;
    content: string;
  };
};

type ApiErrorResponse = {
  error?: string;
  detail?: string | { message?: string };
  message?: string;
  limit?: number;
};

function getDisplayName(user: MessageUser): string {
  return user.global_name && user.global_name !== "None"
    ? user.global_name
    : user.username;
}

function normalizeTimestamp(timestamp: number): number {
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

function asId(value: unknown): string {
  return String(value);
}

function parseJsonWithLargeIds(raw: string): unknown {
  return JSON.parse(
    raw.replace(
      /"(id|sender_id|receiver_id|recipient_id|user_id)"\s*:\s*(\d{16,})/g,
      '"$1":"$2"',
    ),
  );
}

function parseMessageRecord(item: unknown): Message | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const source =
    record.message && typeof record.message === "object"
      ? (record.message as Record<string, unknown>)
      : record;
  const sourceSender = source.sender_id;
  const sourceReceiver = source.receiver_id;
  const sourceId = source.id;
  const sourceContent = source.content;

  if (
    (typeof sourceSender !== "string" && typeof sourceSender !== "number") ||
    (typeof sourceReceiver !== "string" &&
      typeof sourceReceiver !== "number") ||
    (typeof sourceId !== "string" && typeof sourceId !== "number") ||
    typeof sourceContent !== "string"
  ) {
    return null;
  }

  const createdRaw = source.created_at;
  const createdAt =
    typeof createdRaw === "number" ? normalizeTimestamp(createdRaw) : undefined;

  return {
    id: asId(sourceId),
    senderId: asId(sourceSender),
    receiverId: asId(sourceReceiver),
    content: sourceContent,
    createdAt,
  };
}

function toMessageUser(raw: unknown): MessageUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const id = data.id;
  const username = data.username;
  const avatar = data.avatar;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof username !== "string" ||
    typeof avatar !== "string"
  ) {
    return null;
  }

  return {
    id: asId(id),
    username,
    avatar,
    banner:
      typeof data.banner === "string" || data.banner === null
        ? (data.banner as string | null)
        : null,
    custom_banner:
      typeof data.custom_banner === "string" || data.custom_banner === null
        ? (data.custom_banner as string | null)
        : null,
    accent_color:
      typeof data.accent_color === "string" || data.accent_color === null
        ? (data.accent_color as string | null)
        : null,
    usernumber:
      typeof data.usernumber === "number" ? data.usernumber : undefined,
    global_name:
      typeof data.global_name === "string" ? data.global_name : undefined,
    custom_avatar:
      typeof data.custom_avatar === "string" ? data.custom_avatar : undefined,
    premiumtype:
      typeof data.premiumtype === "number" ? data.premiumtype : undefined,
    presence:
      data.presence && typeof data.presence === "object"
        ? (data.presence as MessageUser["presence"])
        : undefined,
    last_seen: typeof data.last_seen === "number" ? data.last_seen : null,
    settings:
      data.settings && typeof data.settings === "object"
        ? (data.settings as MessageUser["settings"])
        : undefined,
    flags: Array.isArray(data.flags) ? (data.flags as UserFlag[]) : undefined,
    primary_guild:
      data.primary_guild && typeof data.primary_guild === "object"
        ? (data.primary_guild as MessageUser["primary_guild"])
        : null,
  };
}

function extractItems(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object") {
    const root = data as Record<string, unknown>;
    const maybeItems = root.items;
    if (Array.isArray(maybeItems)) {
      return maybeItems;
    }
    const maybeConversations = root.conversations;
    if (Array.isArray(maybeConversations)) {
      return maybeConversations;
    }
  }
  return [];
}

function getDayKey(timestamp?: number): string | null {
  if (typeof timestamp !== "number") return null;
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasBannerSettingsData(user: MessageUser | null | undefined): boolean {
  if (!user) return false;
  const hasBannerToggle = typeof user.settings?.banner_discord === "number";
  const hasBannerFields =
    user.banner !== undefined ||
    user.custom_banner !== undefined ||
    user.accent_color !== undefined;
  return hasBannerToggle && hasBannerFields;
}

export default function MessagesInbox() {
  const pathname = usePathname();

  const {
    user: currentUser,
    isAuthenticated,
    isLoading,
    setLoginModal,
  } = useAuthContext();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [canMessageRecipient, setCanMessageRecipient] = useState(true);
  const [isCheckingMessagePermission, setIsCheckingMessagePermission] =
    useState(false);
  const [isProcessingBlockAction, setIsProcessingBlockAction] = useState(false);
  const [blockedByMeByUserId, setBlockedByMeByUserId] = useState<
    Record<string, boolean>
  >({});
  const [currentUserEnriched, setCurrentUserEnriched] =
    useState<MessageUser | null>(null);
  const [routeConversationId, setRouteConversationId] = useState<string | null>(
    null,
  );
  const userLookupCacheRef = useRef<Map<string, MessageUser | null>>(new Map());
  const userLookupPendingRef = useRef<Map<string, Promise<MessageUser | null>>>(
    new Map(),
  );

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
      custom_avatar: currentUser.custom_avatar,
      flags: currentUser.flags,
      primary_guild: currentUser.primary_guild,
      premiumtype: currentUser.premiumtype,
      presence: currentUser.presence,
      last_seen: currentUser.last_seen,
      settings: currentUser.settings,
    };
  }, [currentUser]);

  const selectedUser = selectedConversation?.user ?? null;

  const lastSeenTime = useOptimizedRealTimeRelativeDate(
    selectedUser?.last_seen,
    `messages-last-seen-${selectedUser?.id ?? "none"}`,
  );

  const shouldHidePresence =
    selectedUser?.settings?.hide_presence === 1 &&
    currentUser?.id !== selectedUser?.id;
  const isTargetOnline =
    !!selectedUser &&
    !shouldHidePresence &&
    selectedUser.presence?.status === "Online";
  const selectedUserBlockedByMe =
    !!selectedUser?.id && blockedByMeByUserId[selectedUser.id] === true;

  useEffect(() => {
    if (!pathname.startsWith("/messages")) {
      setRouteConversationId(null);
      return;
    }

    const parts = pathname.split("/").filter(Boolean);
    const idFromPath =
      parts.length >= 2 ? decodeURIComponent(parts[1]).trim() : "";
    setRouteConversationId(idFromPath || null);
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
  }, []);

  useEffect(() => {
    setSelectedUserId(routeConversationId);
  }, [routeConversationId]);

  const loadUserById = async (
    id: string,
    options?: { forceRefresh?: boolean },
  ): Promise<MessageUser | null> => {
    const forceRefresh = options?.forceRefresh === true;
    if (!forceRefresh && userLookupCacheRef.current.has(id)) {
      const cached = userLookupCacheRef.current.get(id) ?? null;
      if (hasBannerSettingsData(cached)) {
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
        console.error("Error loading user by id:", error);
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
  }, [currentUserMessageUser, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setConversations([]);
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

        const response = await fetch(`${PUBLIC_API_URL}/messages`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const rawBody = await response.text();
        const parsed = rawBody ? parseJsonWithLargeIds(rawBody) : null;
        const items = extractItems(parsed);

        const groupedConversations = new Map<string, Message>();
        const userHints = new Map<string, MessageUser>();

        for (const item of items) {
          const record = item as Record<string, unknown>;
          const message = parseMessageRecord(item);

          const directUser =
            toMessageUser(record.user) ||
            toMessageUser(record.target_user) ||
            toMessageUser(record.recipient) ||
            toMessageUser(record.other_user);

          if (directUser && directUser.id !== currentUser.id) {
            userHints.set(directUser.id, directUser);
          }

          if (!message) continue;

          const otherId =
            message.senderId === currentUser.id
              ? message.receiverId
              : message.senderId;

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
          return !hinted || !hasBannerSettingsData(hinted);
        });
        const loadedUsers = await Promise.all(
          missingUserIds.map((id) => loadUserById(id, { forceRefresh: true })),
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
          });
        }
        summaries.sort(
          (a, b) =>
            (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
        );

        if (isCancelled) return;

        setConversations(summaries);

        setSelectedUserId((prev) => {
          if (prev && summaries.some((summary) => summary.user.id === prev)) {
            return prev;
          }
          return null;
        });
      } catch (error) {
        if (isCancelled) return;
        console.error("Error fetching conversations:", error);
        setConversations([]);
        setSelectedUserId(null);

        toast.error("Failed to load conversations");
      } finally {
        if (!isCancelled) {
          setIsLoadingConversations(false);
        }
      }
    };

    void fetchConversations();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser || !routeConversationId) {
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
  }, [conversations, currentUser, isAuthenticated, routeConversationId]);

  useEffect(() => {
    if (!selectedUserId || !isAuthenticated || !currentUser) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setMessages([]);
        if (!PUBLIC_API_URL) {
          throw new Error("Public API URL is not configured");
        }

        const response = await fetch(
          `${PUBLIC_API_URL}/messages/${encodeURIComponent(selectedUserId)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const rawBody = await response.text();
        const parsed = rawBody ? parseJsonWithLargeIds(rawBody) : null;
        const items = extractItems(parsed);

        const parsedMessages = items
          .map((item) => parseMessageRecord(item))
          .filter((item): item is Message => Boolean(item))
          .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

        if (!isCancelled) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching messages:", error);
          setMessages([]);
          toast.error("Failed to load messages");
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
  }, [currentUser, isAuthenticated, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || !isAuthenticated || !currentUser) {
      setCanMessageRecipient(true);
      setIsCheckingMessagePermission(false);
      return;
    }

    let isCancelled = false;

    const checkMessagingPermission = async () => {
      try {
        setIsCheckingMessagePermission(true);
        if (!PUBLIC_API_URL) {
          throw new Error("Public API URL is not configured");
        }

        const response = await fetch(
          `${PUBLIC_API_URL}/messages/${encodeURIComponent(selectedUserId)}`,
          {
            method: "HEAD",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (isCancelled) return;

        if (response.status === 200) {
          setCanMessageRecipient(true);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          setCanMessageRecipient(false);
          return;
        }

        setCanMessageRecipient(false);
      } catch (error) {
        if (!isCancelled) {
          console.error("Error checking messaging permission:", error);
          setCanMessageRecipient(false);
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingMessagePermission(false);
        }
      }
    };

    void checkMessagingPermission();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, isAuthenticated, selectedUserId]);

  const updateBlockStatus = (targetUserId: string, isBlocked: boolean) => {
    setBlockedByMeByUserId((prev) => ({ ...prev, [targetUserId]: isBlocked }));
  };

  const handleBlockToggle = async (
    targetUserId: string,
    shouldBlock: boolean,
  ) => {
    try {
      setIsProcessingBlockAction(true);
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const response = await fetch(
        `${PUBLIC_API_URL}/messages/${encodeURIComponent(targetUserId)}/block`,
        {
          method: shouldBlock ? "POST" : "DELETE",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          shouldBlock ? "Failed to block user" : "Failed to unblock user",
        );
      }

      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
      } | null;

      if (body && body.success === false) {
        throw new Error(
          shouldBlock ? "Failed to block user" : "Failed to unblock user",
        );
      }

      updateBlockStatus(targetUserId, shouldBlock);

      if (selectedUserId === targetUserId) {
        try {
          setIsCheckingMessagePermission(true);
          const headResponse = await fetch(
            `${PUBLIC_API_URL}/messages/${encodeURIComponent(targetUserId)}`,
            {
              method: "HEAD",
              credentials: "include",
              cache: "no-store",
            },
          );
          setCanMessageRecipient(headResponse.status === 200);
        } catch {
          setCanMessageRecipient(false);
        } finally {
          setIsCheckingMessagePermission(false);
        }
      }

      toast.success(shouldBlock ? "User blocked" : "User unblocked");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : shouldBlock
            ? "Failed to block user"
            : "Failed to unblock user";
      toast.error(message);
    } finally {
      setIsProcessingBlockAction(false);
    }
  };

  useEffect(() => {
    if (!selectedUserId || !isAuthenticated || !currentUser) {
      return;
    }

    let isCancelled = false;
    const prefetchSelectedUser = async () => {
      const refreshed = await loadUserById(selectedUserId, {
        forceRefresh: true,
      });
      if (!refreshed || isCancelled) return;

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === selectedUserId
            ? { ...conversation, user: { ...conversation.user, ...refreshed } }
            : conversation,
        ),
      );
    };

    void prefetchSelectedUser();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, isAuthenticated, selectedUserId]);

  const selectConversation = (id: string) => {
    if (id !== selectedUserId) {
      setIsLoadingMessages(true);
      setMessages([]);
    }
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

  const handleSendMessage = async () => {
    if (!selectedUserId || !selectedUser) return;
    if (!currentUser) {
      toast.error("You need to be logged in to send messages");
      return;
    }
    if (isCheckingMessagePermission) return;
    if (!canMessageRecipient) {
      toast.error("You cannot message this user");
      return;
    }

    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || isSending) return;

    try {
      setIsSending(true);
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const response = await fetch(
        `${PUBLIC_API_URL}/messages/${encodeURIComponent(selectedUserId)}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: trimmedMessage }),
        },
      );

      const rawBody = await response.text();
      const parsedBody = rawBody
        ? (() => {
            try {
              return parseJsonWithLargeIds(rawBody) as ApiSendResponse &
                ApiErrorResponse;
            } catch {
              return null;
            }
          })()
        : null;

      const detailMessage =
        parsedBody?.detail && typeof parsedBody.detail === "object"
          ? parsedBody.detail.message
          : undefined;
      const apiErrorMessage =
        parsedBody?.detail && typeof parsedBody.detail === "string"
          ? parsedBody.detail
          : detailMessage && typeof detailMessage === "string"
            ? detailMessage
            : parsedBody?.error && typeof parsedBody.error === "string"
              ? parsedBody.error
              : parsedBody?.message && typeof parsedBody.message === "string"
                ? parsedBody.message
                : rawBody.trim();

      const combinedTooLongMessage =
        parsedBody?.error === "message_too_long" &&
        typeof parsedBody?.limit === "number"
          ? `Message too long (max ${parsedBody.limit} characters).`
          : null;
      const fallbackStatusMessage =
        response.status === 401 ? "Unauthorized" : "Failed to send message";

      if (!response.ok || !parsedBody?.success || !parsedBody.message) {
        throw new Error(
          combinedTooLongMessage || apiErrorMessage || fallbackStatusMessage,
        );
      }

      const sentMessage: Message = {
        id: asId(parsedBody.message.id),
        senderId: asId(parsedBody.message.user_id),
        receiverId: asId(parsedBody.message.recipient_id),
        content: parsedBody.message.content,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, sentMessage]);
      setConversations((prev) => [
        { user: selectedUser, lastMessage: sentMessage },
        ...prev.filter((item) => item.user.id !== selectedUserId),
      ]);
      setDraftMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to send message";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 pb-8">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
          <Breadcrumb />
          <div className="border-border-card bg-secondary-bg mt-4 flex min-h-[60vh] flex-1 items-center justify-center rounded-lg border p-6">
            <p className="text-secondary-text text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen px-4 pb-8">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
          <Breadcrumb />
          <div className="border-border-card bg-secondary-bg mt-4 flex min-h-[60vh] flex-1 items-center justify-center rounded-lg border p-6 sm:p-8">
            <div className="text-center">
              <h1 className="text-primary-text text-2xl font-bold">
                Direct Messages
              </h1>
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

  const isComposerDisabled =
    isCheckingMessagePermission || !canMessageRecipient;
  const messagePlaceholder = isCheckingMessagePermission
    ? "Loading..."
    : !canMessageRecipient
      ? "You can't message this user."
      : selectedUser
        ? `Message ${getDisplayName(selectedUser)}...`
        : "Select a conversation to start messaging.";

  return (
    <div className="h-[calc(100dvh-5rem)] overflow-hidden px-4 pb-4">
      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col">
        <Breadcrumb />

        <div className="border-border-card bg-secondary-bg mt-4 grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-lg border shadow-md lg:grid-cols-[320px_1fr]">
          <aside
            className={cn(
              "border-border-card flex h-full min-h-0 flex-col border-b lg:border-r lg:border-b-0",
              selectedUserId ? "hidden lg:block" : "block",
            )}
          >
            <div className="border-border-card border-b px-4 py-3">
              <p className="text-primary-text text-sm font-semibold">
                Recent Conversations
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <p className="text-secondary-text px-4 py-4 text-sm">
                  Loading conversations...
                </p>
              ) : conversations.length === 0 ? (
                <p className="text-secondary-text px-4 py-4 text-sm">
                  No conversations yet.
                </p>
              ) : (
                conversations.map((conversation) => {
                  const isActive = selectedUserId === conversation.user.id;
                  return (
                    <button
                      key={conversation.user.id}
                      onClick={() => selectConversation(conversation.user.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "border-border-card hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-3 border-b border-l-2 border-l-transparent px-4 py-3 text-left transition-colors",
                        isActive ? "bg-tertiary-bg border-l-button-info" : "",
                      )}
                    >
                      <UserAvatar
                        userId={conversation.user.id}
                        avatarHash={conversation.user.avatar}
                        username={conversation.user.username}
                        custom_avatar={conversation.user.custom_avatar}
                        size={9}
                        showBadge={false}
                        settings={conversation.user.settings}
                        premiumType={conversation.user.premiumtype}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-primary-text truncate text-sm font-medium",
                            isActive ? "text-link" : "",
                          )}
                        >
                          {getDisplayName(conversation.user)}
                        </p>
                        <p className="text-secondary-text truncate text-xs">
                          {conversation.lastMessage?.content ??
                            "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section
            className={cn(
              "min-h-0",
              selectedUserId ? "block" : "hidden lg:block",
            )}
          >
            {!selectedUser ? (
              <div className="flex h-full items-center justify-center p-6">
                <p className="text-secondary-text text-sm">
                  Select a conversation to start messaging.
                </p>
              </div>
            ) : (
              <Chat className="h-full min-h-0">
                <ChatHeader className="border-border-card border-b px-4 py-3">
                  <ChatHeaderAddon>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={goToConversationList}
                      aria-label="Back to conversations"
                    >
                      <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
                    </Button>
                  </ChatHeaderAddon>
                  <ChatHeaderAddon>
                    <Link
                      href={`/users/${selectedUser.id}`}
                      prefetch={false}
                      className="cursor-pointer"
                      aria-label={`View ${getDisplayName(selectedUser)} profile`}
                    >
                      <UserAvatar
                        userId={selectedUser.id}
                        avatarHash={selectedUser.avatar}
                        username={selectedUser.username}
                        custom_avatar={selectedUser.custom_avatar}
                        size={8}
                        isOnline={isTargetOnline}
                        showBadge={true}
                        onlineRingClassName="ring-2"
                        settings={selectedUser.settings}
                        premiumType={selectedUser.premiumtype}
                      />
                    </Link>
                  </ChatHeaderAddon>
                  <ChatHeaderMain>
                    <div className="flex min-w-0 flex-col">
                      <Link
                        href={`/users/${selectedUser.id}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link cursor-pointer truncate text-left text-sm font-semibold transition-colors sm:text-base"
                      >
                        {getDisplayName(selectedUser)}
                      </Link>
                      {shouldHidePresence ? (
                        <p className="text-secondary-text truncate text-xs">
                          Last seen: Hidden
                        </p>
                      ) : isTargetOnline ? (
                        <p
                          className="truncate text-xs"
                          style={{
                            color: "var(--color-status-success-vibrant)",
                          }}
                        >
                          Online
                        </p>
                      ) : selectedUser.last_seen ? (
                        <p className="text-secondary-text truncate text-xs">
                          Last seen: {lastSeenTime}
                        </p>
                      ) : (
                        <p className="text-secondary-text truncate text-xs">
                          Last seen unavailable
                        </p>
                      )}
                    </div>
                  </ChatHeaderMain>
                  <ChatHeaderAddon>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Conversation actions"
                          className="text-primary-text hover:bg-secondary-bg cursor-pointer rounded-sm p-1 transition-colors"
                        >
                          <Icon
                            icon="heroicons:ellipsis-horizontal"
                            className="h-5 w-5"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="p-0">
                        {currentUser?.id !== selectedUser.id && (
                          <DropdownMenuItem
                            onClick={() =>
                              void handleBlockToggle(
                                selectedUser.id,
                                !selectedUserBlockedByMe,
                              )
                            }
                            disabled={isProcessingBlockAction}
                            className="bg-tertiary-bg text-button-danger hover:bg-button-danger/10 hover:text-button-danger focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2"
                          >
                            <Icon
                              icon={
                                selectedUserBlockedByMe
                                  ? "heroicons:lock-open"
                                  : "heroicons:no-symbol"
                              }
                              className="h-4 w-4"
                            />
                            {selectedUserBlockedByMe
                              ? "Unblock User"
                              : "Block User"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ChatHeaderAddon>
                </ChatHeader>

                <ChatMessages className="bg-secondary-bg !flex-col px-2 py-3 sm:px-4">
                  {isLoadingMessages ? (
                    <div className="text-secondary-text bg-tertiary-bg/40 border-border-card mx-auto my-auto rounded-md border px-4 py-3 text-center text-sm">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-secondary-text bg-tertiary-bg border-border-card mx-auto my-auto rounded-md border px-4 py-3 text-center text-sm">
                      {canMessageRecipient
                        ? "No messages yet. Start the conversation."
                        : "This user has blocked you from messaging them."}
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const currentUserId = currentUser
                        ? asId(currentUser.id)
                        : "";
                      const senderId = asId(message.senderId);
                      const isOwnMessage =
                        !!currentUserId && senderId === currentUserId;
                      const sender =
                        (isOwnMessage && currentUser
                          ? (currentUserEnriched ?? currentUserMessageUser)
                          : selectedUser) ??
                        selectedUser ??
                        currentUserMessageUser;
                      if (!sender) {
                        return null;
                      }
                      const currentDayKey = getDayKey(message.createdAt);
                      const previousDayKey = getDayKey(
                        messages[index - 1]?.createdAt,
                      );
                      const showDaySeparator =
                        !!currentDayKey && currentDayKey !== previousDayKey;

                      return (
                        <div key={message.id}>
                          {showDaySeparator &&
                            typeof message.createdAt === "number" && (
                              <ChatEvent className="items-center gap-2 py-2">
                                <div className="border-secondary-text/30 flex-1 border-t" />
                                <ChatEventTime
                                  timestamp={message.createdAt}
                                  format="longDate"
                                  className="text-secondary-text min-w-max text-xs font-semibold"
                                />
                                <div className="border-secondary-text/30 flex-1 border-t" />
                              </ChatEvent>
                            )}
                          <ChatEvent
                            className={cn(
                              "items-start rounded-md py-1 transition-colors",
                              isOwnMessage ? "bg-tertiary-bg/25" : "",
                            )}
                          >
                            <ChatEventAddon>
                              <Link
                                href={`/users/${sender.id}`}
                                prefetch={false}
                                className="cursor-pointer"
                                aria-label={`View ${getDisplayName(sender)} profile`}
                              >
                                <UserAvatar
                                  userId={sender.id}
                                  avatarHash={sender.avatar}
                                  username={sender.username}
                                  custom_avatar={sender.custom_avatar}
                                  size={7}
                                  showBadge={false}
                                  settings={sender.settings}
                                  premiumType={sender.premiumtype}
                                />
                              </Link>
                            </ChatEventAddon>
                            <ChatEventBody>
                              <ChatEventTitle>
                                {isOwnMessage ? (
                                  <Link
                                    href={`/users/${sender.id}`}
                                    prefetch={false}
                                    className="text-primary-text hover:text-link cursor-pointer text-xs font-medium transition-colors sm:text-sm"
                                  >
                                    You
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/users/${sender.id}`}
                                    prefetch={false}
                                    className="text-primary-text hover:text-link cursor-pointer text-xs font-medium transition-colors sm:text-sm"
                                  >
                                    {getDisplayName(selectedUser)}
                                  </Link>
                                )}
                                {typeof message.createdAt === "number" && (
                                  <ChatEventTime
                                    timestamp={message.createdAt}
                                    format="time"
                                  />
                                )}
                              </ChatEventTitle>
                              <ChatEventContent className="text-primary-text break-words whitespace-pre-wrap">
                                {message.content}
                              </ChatEventContent>
                            </ChatEventBody>
                          </ChatEvent>
                        </div>
                      );
                    })
                  )}
                </ChatMessages>

                <ChatToolbar className="border-border-card [&>div]:border-border-card [&>div]:bg-secondary-bg border-t p-3">
                  <ChatToolbarTextarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onSubmit={handleSendMessage}
                    placeholder={messagePlaceholder}
                    maxLength={1000}
                    disabled={isComposerDisabled}
                    className="text-secondary-text placeholder-secondary-text"
                  />
                  <ChatToolbarAddon align="inline-end">
                    <ChatToolbarButton
                      onClick={() => void handleSendMessage()}
                      aria-label="Send message"
                      disabled={
                        isComposerDisabled || !draftMessage.trim() || isSending
                      }
                    >
                      {isSending ? (
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <Icon
                          icon="heroicons:paper-airplane"
                          className="h-4 w-4"
                        />
                      )}
                    </ChatToolbarButton>
                  </ChatToolbarAddon>
                </ChatToolbar>
              </Chat>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
