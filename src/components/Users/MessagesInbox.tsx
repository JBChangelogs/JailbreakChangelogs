"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { sanitizeText } from "@/utils/sanitizeText";
import { PUBLIC_API_URL, searchUsers } from "@/utils/api";
import { respondToTradeOfferV2 } from "@/utils/trading";
import { decode as decodeHtmlEntities } from "he";
import type { UserData, UserFlag, UserSettings } from "@/types/auth";

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
  metadata?: Record<string, unknown> | null;
  createdAt?: number;
  type?: "user" | "system";
};

type OfferAcceptedMetadata = {
  type: "offer_accepted";
  user?: string | number;
  offer?: number;
  trade?: number;
  trade_user?: string | number;
};

type TradeOfferDetails = {
  id: number;
  trade: number;
  note: string | null;
  offering?: Array<{ name?: string; amount?: number }> | null;
  requesting?: Array<{ name?: string; amount?: number }> | null;
  user?: { id?: string | number } | null;
  created_at?: number | string;
  status?: number;
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
  reason?: string;
  detail?: string | { message?: string };
  message?: string;
  limit?: number;
};

type RealtimeMessageEventDetail = {
  action?: "message_received" | "message_sent";
  data?: {
    id?: string;
    user_id?: string;
    recipient_id?: string;
    content?: string;
  };
};
const WS_SEND_FALLBACK_MS = 1200;

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

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseJsonWithLargeIds(raw: string): unknown {
  return JSON.parse(
    raw.replace(
      /"(id|sender_id|receiver_id|recipient_id|user_id|blocked_user_id)"\s*:\s*(\d{16,})/g,
      '"$1":"$2"',
    ),
  );
}

function parseOfferAcceptedMetadata(
  metadata: Record<string, unknown> | null | undefined,
): OfferAcceptedMetadata | null {
  if (!metadata || typeof metadata !== "object") return null;
  if (metadata.type !== "offer_accepted") return null;
  const trade = asNumber(metadata.trade);
  const offer = asNumber(metadata.offer);
  if (!trade || !offer) return null;
  return {
    type: "offer_accepted",
    user: metadata.user as OfferAcceptedMetadata["user"],
    trade,
    offer,
    trade_user: metadata.trade_user as OfferAcceptedMetadata["trade_user"],
  };
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
  const sourceMetadata = source.metadata;

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
    metadata:
      sourceMetadata && typeof sourceMetadata === "object"
        ? (sourceMetadata as Record<string, unknown>)
        : sourceMetadata === null
          ? null
          : undefined,
    createdAt,
    type:
      sourceMetadata && typeof sourceMetadata === "object" ? "system" : "user",
  };
}

function formatSystemMessageContent(
  message: Message,
  currentUserId: string | null,
  selectedUser: MessageUser | null,
): string {
  const metadata = message.metadata;
  if (!metadata) return message.content ?? "";

  const type = metadata.type;
  if (typeof type !== "string") return message.content ?? "";

  if (type === "offer_accepted") {
    const acceptorId = metadata.trade_user;
    const acceptorIdString =
      typeof acceptorId === "string" || typeof acceptorId === "number"
        ? asId(acceptorId)
        : null;

    if (currentUserId && acceptorIdString === currentUserId) {
      return "You have accepted a trade offer.";
    }

    const otherName = selectedUser ? getDisplayName(selectedUser) : "They";
    return `${otherName} has accepted your trade offer.`;
  }

  return message.content ?? "";
}

function summarizeOfferSide(
  items: TradeOfferDetails["offering"] | TradeOfferDetails["requesting"],
): string {
  if (!items || !Array.isArray(items) || items.length === 0) return "—";
  const parts = items
    .map((item) => {
      const name = typeof item?.name === "string" ? item.name : "Unknown";
      const amount = typeof item?.amount === "number" ? item.amount : 1;
      return amount > 1 ? `${amount}× ${name}` : name;
    })
    .filter(Boolean);
  return parts.join(", ");
}

function toMessageUser(raw: unknown): MessageUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const id = data.id;
  const username = data.username;
  const avatar = data.avatar;
  const rawSettings =
    data.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : null;
  const avatarDiscord =
    rawSettings && typeof rawSettings.avatar_discord === "number"
      ? rawSettings.avatar_discord
      : 1;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof username !== "string" ||
    typeof avatar !== "string"
  ) {
    return null;
  }

  const settings = {
    ...(rawSettings ? (rawSettings as MessageUser["settings"]) : {}),
    avatar_discord: avatarDiscord,
  } satisfies MessageUser["settings"] as MessageUser["settings"];

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
    settings,
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

function hasAvatarSettingsData(user: MessageUser | null | undefined): boolean {
  if (!user) return false;
  return typeof user.settings?.avatar_discord === "number";
}

function formatMessageText(value: string): string {
  return sanitizeText(decodeHtmlEntities(value));
}

export default function MessagesInbox() {
  const pathname = usePathname();
  const router = useRouter();

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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isProcessingBlockAction, setIsProcessingBlockAction] = useState(false);
  const [blockedByMeByUserId, setBlockedByMeByUserId] = useState<
    Record<string, boolean>
  >({});
  const [currentUserEnriched, setCurrentUserEnriched] =
    useState<MessageUser | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserData[]>([]);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const userSearchRequestIdRef = useRef(0);

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
  const userLookupCacheRef = useRef<Map<string, MessageUser | null>>(new Map());
  const userLookupPendingRef = useRef<Map<string, Promise<MessageUser | null>>>(
    new Map(),
  );
  const selectedUserIdRef = useRef<string | null>(null);
  const wsSendFallbackTimeoutsRef = useRef<Set<number>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
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
  const currentUserId = currentUser ? asId(currentUser.id) : null;

  const offerAcceptedEvents = useMemo(() => {
    const parsed = messages
      .map((message) => {
        const metadata = parseOfferAcceptedMetadata(
          message.metadata ?? undefined,
        );
        if (!metadata) return null;
        return {
          messageId: message.id,
          createdAt: message.createdAt ?? 0,
          metadata,
        };
      })
      .filter(Boolean) as Array<{
      messageId: string;
      createdAt: number;
      metadata: OfferAcceptedMetadata;
    }>;

    parsed.sort((a, b) => b.createdAt - a.createdAt);
    return parsed;
  }, [messages]);

  const [activeOfferAcceptedIndex, setActiveOfferAcceptedIndex] = useState(0);
  const [offerBannerVisible, setOfferBannerVisible] = useState(false);
  const offerDetailsCacheRef = useRef<Map<string, TradeOfferDetails | null>>(
    new Map(),
  );
  const [activeOfferDetailsStatus, setActiveOfferDetailsStatus] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "loaded"; data: TradeOfferDetails }
    | { status: "not_found" }
    | { status: "error"; error: string }
  >({ status: "idle" });

  useEffect(() => {
    setActiveOfferAcceptedIndex(0);
    setOfferBannerVisible(false);
  }, [selectedUserId, offerAcceptedEvents.length]);

  useEffect(() => {
    const active = offerAcceptedEvents[activeOfferAcceptedIndex];
    if (!active) {
      setActiveOfferDetailsStatus({ status: "idle" });
      return;
    }
    if (!PUBLIC_API_URL) {
      setActiveOfferDetailsStatus({
        status: "error",
        error: "Trade API is not configured",
      });
      return;
    }

    const key = `${active.metadata.trade}:${active.metadata.offer}`;
    const cached = offerDetailsCacheRef.current.get(key);
    if (cached) {
      setActiveOfferDetailsStatus({ status: "loaded", data: cached });
      return;
    }
    if (cached === null) {
      setActiveOfferDetailsStatus({
        status: "error",
        error: "Unable to load trade offer details",
      });
      return;
    }

    let isCancelled = false;
    const run = async () => {
      setActiveOfferDetailsStatus({ status: "loading" });
      try {
        const response = await fetch(
          `${PUBLIC_API_URL}/trades/v2/${encodeURIComponent(String(active.metadata.trade))}/offers/${encodeURIComponent(String(active.metadata.offer))}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const raw = await response.text();
        const parsed = raw ? (parseJsonWithLargeIds(raw) as unknown) : null;

        if (response.status === 404 && parsed && typeof parsed === "object") {
          const errorCode = (parsed as Record<string, unknown>).error;
          if (errorCode === "trade_not_found") {
            offerDetailsCacheRef.current.set(key, null);
            setActiveOfferDetailsStatus({ status: "not_found" });
            return;
          }
        }

        if (!response.ok || !parsed || typeof parsed !== "object") {
          throw new Error("Unable to load trade offer details");
        }

        const data = parsed as TradeOfferDetails;
        if (!isCancelled) {
          offerDetailsCacheRef.current.set(key, data);
          setActiveOfferDetailsStatus({ status: "loaded", data });
        }
      } catch (err) {
        console.error("Offer details fetch error:", err);
        if (!isCancelled) {
          offerDetailsCacheRef.current.set(key, null);
          setActiveOfferDetailsStatus({
            status: "error",
            error: err instanceof Error ? err.message : "Failed to load offer",
          });
        }
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [activeOfferAcceptedIndex, offerAcceptedEvents]);

  useEffect(() => {
    if (activeOfferDetailsStatus.status === "loaded") {
      setOfferBannerVisible(activeOfferDetailsStatus.data.status === 1);
      return;
    }
    setOfferBannerVisible(false);
  }, [activeOfferDetailsStatus]);

  const activeOfferAccepted = offerAcceptedEvents[activeOfferAcceptedIndex];
  const canMarkOfferComplete = useMemo(() => {
    if (!currentUserId || !activeOfferAccepted) return false;
    const userId = asId(currentUserId);
    const participants = [
      activeOfferAccepted.metadata.user,
      activeOfferAccepted.metadata.trade_user,
      activeOfferDetailsStatus.status === "loaded"
        ? activeOfferDetailsStatus.data.user?.id
        : null,
    ];
    return participants.some((id) => {
      if (typeof id !== "string" && typeof id !== "number") return false;
      return asId(id) === userId;
    });
  }, [activeOfferAccepted, activeOfferDetailsStatus, currentUserId]);

  const [isMarkingOfferComplete, setIsMarkingOfferComplete] = useState(false);

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
  }, []);

  useEffect(() => {
    setSelectedUserId(routeConversationId);
  }, [routeConversationId]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsRealtimeConnected(false);
      return;
    }

    const handleConnectionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ connected?: boolean }>).detail;
      setIsRealtimeConnected(detail?.connected === true);
    };

    window.addEventListener(
      "realtimeNotificationsConnection",
      handleConnectionChange,
    );
    return () => {
      window.removeEventListener(
        "realtimeNotificationsConnection",
        handleConnectionChange,
      );
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const fallbackTimeouts = wsSendFallbackTimeoutsRef.current;

    return () => {
      fallbackTimeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      fallbackTimeouts.clear();
    };
  }, []);

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
        console.error("Error searching users:", error);
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
  }, [currentUserId, userSearchQuery]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
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

        const response = await fetch(
          `${PUBLIC_API_URL}/messages?nocache=true`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

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

          if (directUser && directUser.id !== currentUserId) {
            userHints.set(directUser.id, directUser);
          }

          if (!message) continue;

          const otherId =
            message.senderId === currentUserId
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
        setIsLoadingConversations(false);
      }
    };

    void fetchConversations();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, isAuthenticated]);

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

        const response = await fetch(`${PUBLIC_API_URL}/messages/blocked`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
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
          console.error("Error fetching blocked users:", error);
          setBlockedByMeByUserId({});
        }
      }
    };

    void fetchBlockedUsers();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, isAuthenticated, selectedUserId]);

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
  }, [conversations, currentUserId, isAuthenticated, routeConversationId]);

  useEffect(() => {
    if (!selectedUserId || !isAuthenticated || !currentUserId) {
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
  }, [currentUserId, isAuthenticated, selectedUserId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      return;
    }

    const handleRealtimeMessage = (event: Event) => {
      const detail = (event as CustomEvent<RealtimeMessageEventDetail>).detail;
      const action = detail?.action;
      const payload = detail?.data;

      if (
        (action !== "message_received" && action !== "message_sent") ||
        !payload ||
        typeof payload.id !== "string" ||
        typeof payload.user_id !== "string" ||
        typeof payload.recipient_id !== "string" ||
        typeof payload.content !== "string"
      ) {
        return;
      }

      const senderId = asId(payload.user_id);
      const receiverId = asId(payload.recipient_id);
      if (senderId !== currentUserId && receiverId !== currentUserId) {
        return;
      }

      const realtimeMessage: Message = {
        id: asId(payload.id),
        senderId,
        receiverId,
        content: payload.content,
        createdAt: Date.now(),
      };

      const counterpartId = senderId === currentUserId ? receiverId : senderId;
      if (counterpartId !== selectedUserId) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item.id === realtimeMessage.id)) {
          return prev;
        }
        return [...prev, realtimeMessage].sort(
          (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
        );
      });

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === counterpartId
            ? { ...conversation, lastMessage: realtimeMessage }
            : conversation,
        ),
      );
    };

    window.addEventListener("realtimeMessage", handleRealtimeMessage);
    return () => {
      window.removeEventListener("realtimeMessage", handleRealtimeMessage);
    };
  }, [currentUserId, isAuthenticated, selectedUserId]);

  const updateBlockStatus = (targetUserId: string, isBlocked: boolean) => {
    setBlockedByMeByUserId((prev) => ({ ...prev, [targetUserId]: isBlocked }));
  };

  const handleBlockToggle = async (
    targetUserId: string,
    shouldBlock: boolean,
  ) => {
    const loadingMessage = shouldBlock
      ? "Blocking user..."
      : "Unblocking user...";
    const successMessage = shouldBlock ? "User blocked" : "User unblocked";
    const fallbackErrorMessage = shouldBlock
      ? "Failed to block user"
      : "Failed to unblock user";
    const toastId = `messages-block-action:${targetUserId}`;

    try {
      setIsProcessingBlockAction(true);
      toast.loading(loadingMessage, { id: toastId });
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
        throw new Error(fallbackErrorMessage);
      }

      updateBlockStatus(targetUserId, shouldBlock);

      toast.success(successMessage, { id: toastId });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : fallbackErrorMessage;
      toast.error(message, { id: toastId });
    } finally {
      setIsProcessingBlockAction(false);
    }
  };

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

  const handleSendMessage = async () => {
    if (!selectedUserId || !selectedUser) return;
    if (!currentUser) {
      toast.error("You need to be logged in to send messages");
      return;
    }

    const trimmedMessage = sanitizeText(draftMessage.trim());
    if (!trimmedMessage || isSending) return;

    try {
      setIsSending(true);
      pendingOwnSendScrollRef.current = true;
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
            : parsedBody?.message && typeof parsedBody.message === "string"
              ? parsedBody.message
              : parsedBody?.error && typeof parsedBody.error === "string"
                ? parsedBody.error
                : rawBody.trim();

      const combinedTooLongMessage =
        parsedBody?.error === "message_too_long" &&
        typeof parsedBody?.limit === "number"
          ? `Message too long (max ${parsedBody.limit} characters).`
          : null;
      const fallbackStatusMessage =
        response.status === 401 ? "Unauthorized" : "Failed to send message";

      if (!response.ok || !parsedBody?.success || !parsedBody.message) {
        if (parsedBody?.error === "unmessageable") {
          const defaultSystemMessage =
            parsedBody?.reason === "not_mutual"
              ? "Your message could not be delivered. You both need to follow each other."
              : parsedBody?.reason === "blocked"
                ? "Your message could not be delivered. You are blocked from messaging this user."
                : "Your message could not be delivered.";
          const systemContent = parsedBody.message || defaultSystemMessage;
          toast.error(systemContent);
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            senderId: "system",
            receiverId: asId(selectedUserId),
            content: systemContent,
            createdAt: Date.now(),
            type: "system",
          };
          setMessages((prev) => {
            const existingIndex = [...prev]
              .reverse()
              .findIndex(
                (item) =>
                  item.type === "system" && item.content === systemContent,
              );
            if (existingIndex === -1) {
              return [...prev, systemMessage];
            }

            const indexFromStart = prev.length - 1 - existingIndex;
            const existing = prev[indexFromStart];
            if (!existing) {
              return [...prev, systemMessage];
            }

            const updated: Message = {
              ...existing,
              createdAt: Date.now(),
            };

            return [
              ...prev.slice(0, indexFromStart),
              ...prev.slice(indexFromStart + 1),
              updated,
            ];
          });
          setDraftMessage("");
          return;
        }

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

      if (isRealtimeConnected) {
        const targetUserId = selectedUserId;
        const timeoutId = window.setTimeout(() => {
          wsSendFallbackTimeoutsRef.current.delete(timeoutId);
          if (!targetUserId || selectedUserIdRef.current !== targetUserId) {
            return;
          }
          setMessages((prev) => {
            if (prev.some((item) => item.id === sentMessage.id)) {
              return prev;
            }
            return [...prev, sentMessage];
          });
        }, WS_SEND_FALLBACK_MS);
        wsSendFallbackTimeoutsRef.current.add(timeoutId);
      } else {
        setMessages((prev) => {
          if (prev.some((item) => item.id === sentMessage.id)) {
            return prev;
          }
          return [...prev, sentMessage];
        });
      }
      setConversations((prev) => [
        { user: selectedUser, lastMessage: sentMessage },
        ...prev.filter((item) => item.user.id !== selectedUserId),
      ]);
      setDraftMessage("");
    } catch (error) {
      pendingOwnSendScrollRef.current = false;
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

  const messagePlaceholder = selectedUser
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
              selectedUserId ? "hidden lg:flex" : "",
            )}
          >
            <div className="border-border-card border-b px-4 py-3">
              <p className="text-primary-text text-sm font-semibold">
                {userSearchQuery.trim()
                  ? "Search Results"
                  : "Recent Conversations"}
              </p>
            </div>
            <div className="border-border-card border-b px-4 py-3">
              <div className="relative">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="text-secondary-text pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                />
                <input
                  value={userSearchQuery}
                  onChange={(event) => setUserSearchQuery(event.target.value)}
                  placeholder="Search users to message..."
                  className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-md border py-2 pr-9 pl-9 text-sm transition-colors outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={!isAuthenticated}
                />
                {userSearchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery("")}
                    className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer transition-colors"
                    aria-label="Clear search"
                  >
                    <Icon icon="heroicons:x-mark" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain">
              {userSearchQuery.trim() ? (
                isUserSearchLoading ? (
                  <p className="text-secondary-text px-4 py-4 text-sm">
                    Searching...
                  </p>
                ) : userSearchResults.length === 0 ? (
                  <p className="text-secondary-text px-4 py-4 text-sm">
                    No users found.
                  </p>
                ) : (
                  userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setUserSearchQuery("");
                        selectConversation(user.id);
                      }}
                      className="border-border-card hover:bg-tertiary-bg group flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition-colors"
                    >
                      <UserAvatar
                        userId={user.id}
                        avatarHash={user.avatar}
                        username={user.username}
                        custom_avatar={user.custom_avatar}
                        size={8}
                        showBadge={false}
                        settings={user.settings}
                        premiumType={user.premiumtype}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-primary-text group-hover:text-link truncate text-sm font-medium transition-colors">
                          {user.global_name && user.global_name !== "None"
                            ? user.global_name
                            : user.username}
                        </p>
                        <p className="text-secondary-text truncate text-[11px]">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  ))
                )
              ) : isLoadingConversations ? (
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
                  const isSystemPreview =
                    conversation.lastMessage?.type === "system";
                  const previewText = conversation.lastMessage
                    ? conversation.lastMessage.type === "system"
                      ? formatSystemMessageContent(
                          conversation.lastMessage,
                          currentUserId,
                          conversation.user,
                        )
                      : conversation.lastMessage.content
                    : "No messages yet";
                  return (
                    <button
                      key={conversation.user.id}
                      onClick={() => selectConversation(conversation.user.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "border-border-card hover:bg-tertiary-bg flex w-full cursor-pointer items-center gap-3 border-b border-l-2 border-l-transparent px-4 py-3 text-left transition-colors",
                        isActive ? "bg-tertiary-bg border-l-button-info" : "",
                        isSystemPreview && !isActive ? "bg-tertiary-bg/40" : "",
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
                          {formatMessageText(previewText)}
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
                <ChatHeader
                  className={cn(
                    "border-border-card px-4 py-3",
                    offerBannerVisible && offerAcceptedEvents.length > 0
                      ? ""
                      : "border-b",
                  )}
                >
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
                          Last seen:{" "}
                          {lastSeenTime ? (
                            lastSeenTime
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="text-secondary-text h-3 w-3 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
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
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                              </svg>
                              Loading...
                            </span>
                          )}
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
                        <Button
                          variant="secondary"
                          size="icon"
                          aria-label="Conversation actions"
                        >
                          <Icon
                            icon="heroicons:ellipsis-horizontal"
                            className="h-5 w-5"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="p-0">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/users/${encodeURIComponent(selectedUser.id)}`,
                            )
                          }
                          className="bg-tertiary-bg rounded-none px-3 py-2"
                        >
                          <Icon
                            icon="heroicons:user-circle"
                            className="h-4 w-4"
                          />
                          View Profile
                        </DropdownMenuItem>
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

                {offerBannerVisible &&
                offerAcceptedEvents.length > 0 &&
                selectedUser ? (
                  <div className="border-border-card bg-tertiary-bg border-b px-4 py-2">
                    <div className="border-link bg-button-info/10 grid grid-cols-1 gap-3 rounded-l-none rounded-r-md border-l-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-primary-text truncate text-sm font-semibold">
                          <span className="sm:hidden">Offer accepted</span>
                          <span className="hidden sm:inline">
                            Trade offer accepted
                          </span>
                        </p>
                        {activeOfferDetailsStatus.status === "loading" ? (
                          <p className="text-secondary-text flex items-center gap-2 text-xs">
                            <svg
                              className="h-3.5 w-3.5 animate-spin"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
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
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                            Loading offer details…
                          </p>
                        ) : activeOfferDetailsStatus.status === "loaded" ? (
                          <>
                            <p className="text-secondary-text truncate text-xs">
                              <span className="text-secondary-text/90">
                                Offering:
                              </span>{" "}
                              {summarizeOfferSide(
                                activeOfferDetailsStatus.data.offering,
                              )}
                            </p>
                            <p className="text-secondary-text truncate text-xs">
                              <span className="text-secondary-text/90">
                                Requesting:
                              </span>{" "}
                              {summarizeOfferSide(
                                activeOfferDetailsStatus.data.requesting,
                              )}
                            </p>
                          </>
                        ) : activeOfferDetailsStatus.status === "not_found" ? (
                          <p className="text-secondary-text truncate text-xs">
                            This trade offer has expired.
                          </p>
                        ) : activeOfferDetailsStatus.status === "error" ? (
                          <p className="text-secondary-text truncate text-xs">
                            {activeOfferDetailsStatus.error}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-1">
                          <button
                            type="button"
                            aria-label="Previous accepted offer"
                            disabled={activeOfferAcceptedIndex <= 0}
                            onClick={() =>
                              setActiveOfferAcceptedIndex((prev) =>
                                Math.max(prev - 1, 0),
                              )
                            }
                            className={cn(
                              "text-primary-text flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                              "hover:bg-quaternary-bg cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent",
                            )}
                          >
                            <Icon
                              icon="heroicons:chevron-left"
                              className="h-5 w-5"
                            />
                          </button>
                          <span className="text-secondary-text w-12 text-center text-[11px] tabular-nums">
                            {Math.min(
                              activeOfferAcceptedIndex + 1,
                              offerAcceptedEvents.length,
                            )}{" "}
                            / {offerAcceptedEvents.length}
                          </span>
                          <button
                            type="button"
                            aria-label="Next accepted offer"
                            disabled={
                              activeOfferAcceptedIndex >=
                              offerAcceptedEvents.length - 1
                            }
                            onClick={() =>
                              setActiveOfferAcceptedIndex((prev) =>
                                Math.min(
                                  prev + 1,
                                  offerAcceptedEvents.length - 1,
                                ),
                              )
                            }
                            className={cn(
                              "text-primary-text flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                              "hover:bg-quaternary-bg cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent",
                            )}
                          >
                            <Icon
                              icon="heroicons:chevron-right"
                              className="h-5 w-5"
                            />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-2">
                          <Button
                            asChild
                            size="sm"
                            className="h-8 w-full sm:w-auto"
                          >
                            <Link
                              href={`/trading/ad/${offerAcceptedEvents[activeOfferAcceptedIndex]?.metadata.trade ?? ""}`}
                              prefetch={false}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-disabled={
                                activeOfferDetailsStatus.status === "not_found"
                              }
                              onClick={(event) => {
                                if (
                                  activeOfferDetailsStatus.status ===
                                  "not_found"
                                ) {
                                  event.preventDefault();
                                }
                              }}
                            >
                              <span className="md:hidden">View</span>
                              <span className="hidden md:inline">
                                View trade
                              </span>
                            </Link>
                          </Button>
                          {canMarkOfferComplete &&
                            activeOfferDetailsStatus.status === "loaded" &&
                            activeOfferDetailsStatus.data.status !== 3 && (
                              <Button
                                variant="success"
                                size="sm"
                                className="h-8 w-full sm:w-auto"
                                disabled={isMarkingOfferComplete}
                                onClick={() => {
                                  if (isMarkingOfferComplete) return;
                                  const active =
                                    offerAcceptedEvents[
                                      activeOfferAcceptedIndex
                                    ];
                                  if (!active) return;
                                  setIsMarkingOfferComplete(true);
                                  const toastId = toast.loading(
                                    "Marking offer as completed...",
                                    { duration: Infinity },
                                  );
                                  void (async () => {
                                    try {
                                      await respondToTradeOfferV2(
                                        active.metadata.trade ?? 0,
                                        active.metadata.offer ?? 0,
                                        "complete",
                                      );
                                      toast.success("Offer marked completed", {
                                        id: toastId,
                                        duration: 4000,
                                      });

                                      const key = `${active.metadata.trade}:${active.metadata.offer}`;
                                      const cached =
                                        offerDetailsCacheRef.current.get(key);
                                      if (cached) {
                                        offerDetailsCacheRef.current.set(key, {
                                          ...cached,
                                          status: 3,
                                        });
                                      }

                                      setOfferBannerVisible(false);
                                    } catch (err) {
                                      toast.error(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to mark completed",
                                        { id: toastId, duration: 5000 },
                                      );
                                    } finally {
                                      setIsMarkingOfferComplete(false);
                                    }
                                  })();
                                }}
                              >
                                <Icon
                                  icon="heroicons:check"
                                  className="h-4 w-4"
                                />
                                <span className="md:hidden">Complete</span>
                                <span className="hidden md:inline">
                                  Mark completed
                                </span>
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <ChatMessages
                  ref={messagesContainerRef}
                  className="bg-secondary-bg !flex-col px-2 py-3 sm:px-4"
                >
                  {isLoadingMessages ? (
                    <div className="text-secondary-text bg-tertiary-bg/40 border-border-card mx-auto my-auto rounded-md border px-4 py-3 text-center text-sm">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-secondary-text bg-tertiary-bg border-border-card mx-auto my-auto rounded-md border px-4 py-3 text-center text-sm">
                      No messages yet. Start the conversation.
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      if (message.type === "system") {
                        const systemContent = formatSystemMessageContent(
                          message,
                          currentUser ? asId(currentUser.id) : null,
                          selectedUser ?? null,
                        );
                        return (
                          <ChatEvent
                            key={message.id}
                            className="border-link bg-button-info/10 my-1 items-start rounded-l-none rounded-r-md border-l-2 py-1 pl-2"
                          >
                            <ChatEventAddon>
                              <div className="bg-tertiary-bg border-border-card text-link inline-flex h-7 w-7 items-center justify-center rounded-md border">
                                <Icon icon="lucide:bot" className="h-4 w-4" />
                              </div>
                            </ChatEventAddon>
                            <ChatEventBody>
                              <ChatEventTitle>
                                <span className="text-link text-xs font-medium sm:text-sm">
                                  System
                                </span>
                                {typeof message.createdAt === "number" && (
                                  <ChatEventTime
                                    timestamp={message.createdAt}
                                    format="time"
                                    className="text-secondary-text text-xs font-semibold"
                                  />
                                )}
                              </ChatEventTitle>
                              <ChatEventContent className="text-primary-text break-words whitespace-pre-wrap">
                                {formatMessageText(systemContent)}
                              </ChatEventContent>
                            </ChatEventBody>
                          </ChatEvent>
                        );
                      }

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
                                    className="text-secondary-text text-xs font-semibold"
                                  />
                                )}
                              </ChatEventTitle>
                              <ChatEventContent className="text-primary-text break-words whitespace-pre-wrap">
                                {formatMessageText(message.content ?? "")}
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
                    className="text-secondary-text placeholder-secondary-text"
                  />
                  <ChatToolbarAddon align="inline-end">
                    <ChatToolbarButton
                      onClick={() => void handleSendMessage()}
                      aria-label="Send message"
                      disabled={!draftMessage.trim() || isSending}
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
