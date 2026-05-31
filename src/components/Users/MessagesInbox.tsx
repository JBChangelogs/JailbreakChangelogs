"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
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
import { UserAvatar } from "@/utils/ui/avatar";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { cn } from "@/lib/utils";
import { Chat } from "@/components/chat/chat";
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MessageComposer } from "@/components/Users/MessageComposer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Spinner } from "@/components/ui/Spinner";
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
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { useEmojiStringMap } from "@/hooks/useEmojiStringMap";
import {
  prepareEmojiShortcodeContentForApi,
  prepareEmojiShortcodeDisplayContent,
} from "@/utils/comments/emojiShortcodes";
import {
  PUBLIC_API_URL,
  getRateLimitMessage,
  getResponseErrorMessage,
  searchUsers,
} from "@/utils/api/api";
import { respondToTradeOfferV2 } from "@/utils/trading/core";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  useOfferDetailsBatch,
  type TradeOfferDetails,
} from "@/hooks/useOfferDetailsBatch";
import { decode as decodeHtmlEntities } from "he";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";
import type { UserData, UserFlag, UserSettingsV2 } from "@/types/auth";
import { createLogger } from "@/services/logger";
import { parseBan, showBanToast, BanError } from "@/utils/api/ban";
import { BanBanner } from "@/components/ui/BanBanner";
import { useTwemoji } from "@/contexts/TwemojiContext";
import Twemoji from "react-twemoji";
import { CommentTextarea } from "@/components/PageComments/CommentTextarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const log = createLogger("UI");

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
  settings_v2?: Partial<UserSettingsV2>;
};

type Message = {
  id: string;
  clientId?: string;
  parentId?: string | null;
  senderId: string;
  receiverId: string;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: number;
  updatedAt?: number;
  type?: "user" | "system";
  status?: "pending" | "sent" | "failed";
};

type OfferAcceptedMetadata = {
  type: "offer_accepted";
  user?: string | number;
  offer?: number;
  trade?: number;
  trade_user?: string | number;
};

type ConversationSummary = {
  user: MessageUser;
  lastMessage?: Message;
  messageCount?: number;
};

const MESSAGE_CHAR_LIMIT = 350;

function getLatestMessage(messages: Message[]): Message | undefined {
  let latest: Message | undefined;
  let latestTimestamp = -Infinity;

  for (const message of messages) {
    const timestamp = message.createdAt ?? 0;
    if (!latest || timestamp >= latestTimestamp) {
      latest = message;
      latestTimestamp = timestamp;
    }
  }

  return latest;
}

function sortConversationsByLatestMessage(
  conversations: ConversationSummary[],
): ConversationSummary[] {
  return [...conversations].sort(
    (a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
  );
}

type ApiSendResponse = {
  success: boolean;
  message: {
    id: string;
    parent_id?: string | null;
    user_id: string;
    recipient_id: string;
    content: string;
    updated_at?: number;
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
  action?:
    | "message_received"
    | "message_sent"
    | "message_edited"
    | "message_deleted";
  data?: {
    id?: string;
    parent_id?: string | null;
    user_id?: string;
    recipient_id?: string;
    content?: string;
    metadata?: unknown | null;
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

function formatCountCapped(value: number, max = 99): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return value > max ? `${max}+` : String(Math.floor(value));
}

function compactRelativeLabel(value: string): string {
  const text = value.trim().toLowerCase();
  if (!text) return "";
  if (text === "just now") return "now";
  if (text === "in a moment") return "soon";

  const unitPattern = "(second|minute|hour|day|week|month|year)s?";
  const futureMatch = text.match(
    new RegExp(`^in\\s+(\\d+)\\s+${unitPattern}$`),
  );
  const pastMatch = text.match(new RegExp(`^(\\d+)\\s+${unitPattern}\\s+ago$`));
  const match = futureMatch ?? pastMatch;
  if (!match) return value;

  const amount = Number(match[1]);
  const unit = match[2];
  const suffix =
    unit === "second"
      ? "s"
      : unit === "minute"
        ? "m"
        : unit === "hour"
          ? "h"
          : unit === "day"
            ? "d"
            : unit === "week"
              ? "w"
              : unit === "month"
                ? "mo"
                : unit === "year"
                  ? "y"
                  : unit;

  const compact = `${amount}${suffix}`;
  return futureMatch ? `in ${compact}` : `${compact} ago`;
}

function ConversationRowTime({
  timestamp,
  cacheKey,
}: {
  timestamp?: number;
  cacheKey: string;
}) {
  const relative = useOptimizedRealTimeRelativeDate(
    timestamp ?? null,
    cacheKey,
  );
  const compact = compactRelativeLabel(relative);
  if (!compact) return null;
  return (
    <span className="text-secondary-text shrink-0 text-[11px] tabular-nums">
      {compact}
    </span>
  );
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

function createClientMessageId(): string {
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getMessageDomId(message: Message): string {
  return message.clientId ?? message.id;
}

function sortMessagesByCreatedAt(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

function trimLocalThreadMessages(messages: Message[], max = 200): Message[] {
  if (messages.length <= max) return messages;
  return messages.slice(messages.length - max);
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
  const sourceSender = source.sender_id ?? source.user_id;
  const sourceReceiver = source.receiver_id ?? source.recipient_id;
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
  const updatedRaw = source.updated_at;
  const updatedAt =
    typeof updatedRaw === "number" ? normalizeTimestamp(updatedRaw) : undefined;

  return {
    id: asId(sourceId),
    parentId: source.parent_id ? asId(source.parent_id) : null,
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
    updatedAt,
    type:
      sourceMetadata && typeof sourceMetadata === "object" ? "system" : "user",
  };
}

function resolveMessageParticipants(options: {
  senderCandidate?: unknown;
  receiverCandidate?: unknown;
  fallbackSenderId?: string | null;
  fallbackReceiverId?: string | null;
}): { senderId: string; receiverId: string } | null {
  const senderCandidate =
    typeof options.senderCandidate === "string" ||
    typeof options.senderCandidate === "number"
      ? asId(options.senderCandidate)
      : null;
  const receiverCandidate =
    typeof options.receiverCandidate === "string" ||
    typeof options.receiverCandidate === "number"
      ? asId(options.receiverCandidate)
      : null;
  const fallbackSenderId =
    typeof options.fallbackSenderId === "string" &&
    options.fallbackSenderId.trim()
      ? asId(options.fallbackSenderId)
      : null;
  const fallbackReceiverId =
    typeof options.fallbackReceiverId === "string" &&
    options.fallbackReceiverId.trim()
      ? asId(options.fallbackReceiverId)
      : null;

  if (senderCandidate && receiverCandidate) {
    if (fallbackSenderId && fallbackReceiverId) {
      const sameOrientation =
        senderCandidate === fallbackSenderId &&
        receiverCandidate === fallbackReceiverId;
      const reversedOrientation =
        senderCandidate === fallbackReceiverId &&
        receiverCandidate === fallbackSenderId;

      if (sameOrientation || reversedOrientation) {
        return {
          senderId: fallbackSenderId,
          receiverId: fallbackReceiverId,
        };
      }
    }

    return { senderId: senderCandidate, receiverId: receiverCandidate };
  }

  if (fallbackSenderId && fallbackReceiverId) {
    return { senderId: fallbackSenderId, receiverId: fallbackReceiverId };
  }

  return null;
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

type OfferItem = { name: string; amount: number; type?: string };

function normalizeOfferItems(
  items: TradeOfferDetails["offering"] | TradeOfferDetails["requesting"],
): OfferItem[] {
  if (!items || !Array.isArray(items) || items.length === 0) return [];
  return items
    .map((item) => {
      const name = typeof item?.name === "string" ? item.name.trim() : "";
      const amount = typeof item?.amount === "number" ? item.amount : 1;
      if (!name) return null;
      const type = typeof item?.type === "string" ? item.type : undefined;
      return { name, amount: amount > 0 ? amount : 1, type };
    })
    .filter(Boolean) as OfferItem[];
}

function formatOfferItemSummary(items: OfferItem[], maxItems = 2): string {
  if (!items || items.length === 0) return "—";
  const shown = items
    .slice(0, Math.max(0, maxItems))
    .map((item) =>
      item.amount > 1 ? `${item.name} x${item.amount}` : item.name,
    )
    .filter(Boolean);
  const remaining = Math.max(items.length - shown.length, 0);
  return remaining > 0
    ? `${shown.join(", ")} +${remaining} more`
    : shown.join(", ");
}

function OfferItems({
  label,
  items,
  expanded,
  onExpand,
  onCollapse,
  maxCollapsed = 3,
  display = "chips",
}: {
  label: string;
  items: OfferItem[];
  expanded: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  maxCollapsed?: number;
  display?: "chips" | "text";
}) {
  const visible = expanded ? items : items.slice(0, maxCollapsed);
  const remaining = expanded ? 0 : Math.max(items.length - visible.length, 0);

  return (
    <div className="min-w-0">
      <p className="text-secondary-text text-xs">
        <span className="text-primary-text font-medium">{label}:</span>
      </p>
      {display === "text" ? (
        <div className="mt-1 min-w-0">
          {visible.length === 0 ? (
            <p className="text-secondary-text text-xs">—</p>
          ) : (
            <ul className="space-y-0.5">
              {visible.map((item, idx) => (
                <li
                  key={`${item.name}-${idx}`}
                  className="text-primary-text/80 text-xs leading-snug wrap-break-word"
                >
                  {item.amount > 1 ? (
                    <>
                      {item.name}{" "}
                      <span className="text-secondary-text/90 tabular-nums">
                        x{item.amount}
                      </span>
                    </>
                  ) : (
                    item.name
                  )}
                </li>
              ))}
            </ul>
          )}

          {remaining > 0 ? (
            <button
              type="button"
              onClick={onExpand}
              className={cn(
                "text-link hover:text-link mt-1 inline-flex items-center text-xs font-medium transition-colors",
                onExpand ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onExpand}
              aria-label={`Show ${remaining} more ${label.toLowerCase()} items`}
            >
              +{remaining} more
            </button>
          ) : expanded && items.length > maxCollapsed ? (
            <button
              type="button"
              onClick={onCollapse}
              className={cn(
                "text-link hover:text-link mt-1 inline-flex items-center text-xs font-medium transition-colors",
                onCollapse ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onCollapse}
              aria-label={`Show fewer ${label.toLowerCase()} items`}
            >
              Show less
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
          {visible.length === 0 ? (
            <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl">
              —
            </span>
          ) : (
            visible.map((item, idx) =>
              (() => {
                const categoryIcon =
                  typeof item.type === "string"
                    ? getCategoryIcon(item.type)
                    : null;
                const categoryColor =
                  typeof item.type === "string"
                    ? getCategoryColor(item.type)
                    : null;
                return (
                  <span
                    key={`${item.name}-${idx}`}
                    className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 max-w-56 min-w-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl"
                    title={
                      item.amount > 1
                        ? `${item.name} x${item.amount}`
                        : item.name
                    }
                  >
                    {categoryIcon && categoryColor ? (
                      <categoryIcon.Icon
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: categoryColor }}
                      />
                    ) : null}
                    <span className="truncate">
                      {item.name}
                      {item.amount > 1 ? (
                        <span className="text-secondary-text/90 tabular-nums">
                          {" "}
                          x{item.amount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                );
              })(),
            )
          )}
          {remaining > 0 ? (
            <button
              type="button"
              onClick={onExpand}
              className={cn(
                "text-primary-text border-border-card bg-tertiary-bg/40 hover:bg-quaternary-bg/30 inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl transition-colors",
                "text-link hover:text-link",
                onExpand ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onExpand}
              aria-label={`Show ${remaining} more ${label.toLowerCase()} items`}
            >
              +{remaining} more
            </button>
          ) : expanded && items.length > maxCollapsed ? (
            <button
              type="button"
              onClick={onCollapse}
              className={cn(
                "text-primary-text border-border-card bg-tertiary-bg/40 hover:bg-quaternary-bg/30 inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl transition-colors",
                "text-link hover:text-link",
                onCollapse ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onCollapse}
              aria-label={`Show fewer ${label.toLowerCase()} items`}
            >
              Show less
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function toMessageUser(raw: unknown): MessageUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const id = data.id;
  const username = data.username;
  const avatar = data.avatar;
  const rawSettingsV2 =
    data.settings_v2 && typeof data.settings_v2 === "object"
      ? (data.settings_v2 as Partial<UserSettingsV2>)
      : null;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof username !== "string" ||
    typeof avatar !== "string"
  ) {
    return null;
  }

  const settings_v2: MessageUser["settings_v2"] = rawSettingsV2 ?? undefined;

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
    settings_v2,
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

function extractPagination(data: unknown): {
  page: number | null;
  totalPages: number | null;
  total: number | null;
  size: number | null;
} {
  if (!data || typeof data !== "object") {
    return { page: null, totalPages: null, total: null, size: null };
  }
  const root = data as Record<string, unknown>;
  const page = typeof root.page === "number" ? root.page : null;
  const totalPages =
    typeof root.total_pages === "number" ? root.total_pages : null;
  const total = typeof root.total === "number" ? root.total : null;
  const size = typeof root.size === "number" ? root.size : null;
  return { page, totalPages, total, size };
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
  return typeof user.settings_v2?.custom_avatar === "boolean";
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

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [totalConversations, setTotalConversations] = useState<number | null>(
    null,
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isProcessingBlockAction, setIsProcessingBlockAction] = useState(false);
  const [isMarkingOfferComplete, setIsMarkingOfferComplete] = useState(false);
  const [isUnmessageable, setIsUnmessageable] = useState(false);
  const [blockedByMeByUserId, setBlockedByMeByUserId] = useState<
    Record<string, boolean>
  >({});
  const [currentUserEnriched, setCurrentUserEnriched] =
    useState<MessageUser | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserData[]>([]);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const userSearchInputRef = useRef<HTMLInputElement | null>(null);
  const userSearchRequestIdRef = useRef(0);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesTotalPages, setMessagesTotalPages] = useState<number | null>(
    null,
  );
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const messagesPageRef = useRef(1);
  const messagesTotalPagesRef = useRef<number | null>(null);
  const isLoadingOlderMessagesRef = useRef(false);

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
  const userLookupCacheRef = useRef<Map<string, MessageUser | null>>(new Map());
  const userLookupPendingRef = useRef<Map<string, Promise<MessageUser | null>>>(
    new Map(),
  );
  const selectedUserIdRef = useRef<string | null>(null);
  const routeConversationIdRef = useRef<string | null>(null);
  const wsSendFallbackTimeoutsRef = useRef<Set<number>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const prependScrollRestoreRef = useRef<{
    conversationId: string;
    prevScrollTop: number;
    prevScrollHeight: number;
  } | null>(null);
  const pendingOwnSendScrollRef = useRef(false);
  const initialScrollConversationIdRef = useRef<string | null>(null);
  const recentRealtimeEventKeysRef = useRef<Map<string, number>>(new Map());
  const localThreadMessagesByUserIdRef = useRef<Map<string, Message[]>>(
    new Map(),
  );

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

  const upsertLocalThreadMessage = useCallback(
    (counterpartUserId: string, message: Message) => {
      const store = localThreadMessagesByUserIdRef.current;
      const existing = store.get(counterpartUserId) ?? [];
      const idx = existing.findIndex((m) => m.id === message.id);
      if (idx !== -1) {
        const next = [...existing];
        next[idx] = { ...next[idx], ...message };
        store.set(counterpartUserId, trimLocalThreadMessages(next));
        return;
      }
      if (message.clientId) {
        const clientIdx = existing.findIndex(
          (m) => m.clientId === message.clientId,
        );
        if (clientIdx !== -1) {
          const next = [...existing];
          next[clientIdx] = { ...next[clientIdx], ...message };
          store.set(counterpartUserId, trimLocalThreadMessages(next));
          return;
        }
      }
      store.set(
        counterpartUserId,
        trimLocalThreadMessages([...existing, message]),
      );
    },
    [],
  );

  const updateLocalThreadMessage = useCallback(
    (
      counterpartUserId: string,
      predicate: (message: Message) => boolean,
      patch: (message: Message) => Message,
    ) => {
      const store = localThreadMessagesByUserIdRef.current;
      const existing = store.get(counterpartUserId) ?? [];
      const idx = existing.findIndex(predicate);
      if (idx === -1) return;
      const next = [...existing];
      next[idx] = patch(next[idx] as Message);
      store.set(counterpartUserId, trimLocalThreadMessages(next));
    },
    [],
  );

  const removeLocalThreadMessage = useCallback(
    (counterpartUserId: string, predicate: (message: Message) => boolean) => {
      const store = localThreadMessagesByUserIdRef.current;
      const existing = store.get(counterpartUserId) ?? [];
      const next = existing.filter((m) => !predicate(m));
      store.set(counterpartUserId, next);
    },
    [],
  );

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

  const getOfferDetailsKey = useCallback(
    (metadata: OfferAcceptedMetadata) =>
      `${metadata.trade}:${metadata.offer}` as const,
    [],
  );

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
  const [isOfferBannerMinimized, setIsOfferBannerMinimized] = useState(true);

  const {
    map: offerDetailsMap,
    setMap: setOfferDetailsMap,
    status: offerDetailsStatus,
  } = useOfferDetailsBatch(offerAcceptedEvents.map((entry) => entry.metadata));

  const visibleOfferAcceptedEvents = useMemo(() => {
    return offerAcceptedEvents.filter((entry) => {
      const key = getOfferDetailsKey(entry.metadata);
      const cached = offerDetailsMap[key];
      if (cached === null) return false;
      if (cached && cached.status !== 1) return false;
      return true;
    });
  }, [offerAcceptedEvents, getOfferDetailsKey, offerDetailsMap]);

  useEffect(() => {
    setActiveOfferAcceptedIndex(0);
    setIsOfferBannerMinimized(true);
  }, [selectedUserId, visibleOfferAcceptedEvents.length]);

  useEffect(() => {
    if (
      activeOfferAcceptedIndex >= visibleOfferAcceptedEvents.length &&
      visibleOfferAcceptedEvents.length > 0
    ) {
      setActiveOfferAcceptedIndex(visibleOfferAcceptedEvents.length - 1);
    }
    if (visibleOfferAcceptedEvents.length === 0) {
      setActiveOfferAcceptedIndex(0);
    }
  }, [activeOfferAcceptedIndex, visibleOfferAcceptedEvents.length]);

  useEffect(() => {
    // Default to minimized on small screens to preserve chat space.
    const query = window.matchMedia("(min-width: 640px)");
    const apply = () => setIsOfferBannerMinimized(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const activeOfferAccepted =
    visibleOfferAcceptedEvents[activeOfferAcceptedIndex];

  const activeOfferDetailsStatus = useMemo<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "loaded"; data: TradeOfferDetails }
    | { status: "not_found" }
    | { status: "error"; error: string }
  >(() => {
    if (!activeOfferAccepted) return { status: "idle" };
    if (!PUBLIC_API_URL) {
      return { status: "error", error: "Trade API is not configured" };
    }
    if (offerDetailsStatus === "error") {
      return { status: "error", error: "Unable to load trade offer details" };
    }
    const key = getOfferDetailsKey(activeOfferAccepted.metadata);
    const cached = offerDetailsMap[key];
    if (cached) return { status: "loaded", data: cached };
    if (cached === null) return { status: "not_found" };
    if (offerDetailsStatus === "loading") return { status: "loading" };
    return { status: "loading" };
  }, [
    activeOfferAccepted,
    getOfferDetailsKey,
    offerDetailsMap,
    offerDetailsStatus,
  ]);

  useEffect(() => {
    if (activeOfferAcceptedIndex < visibleOfferAcceptedEvents.length) return;
    setActiveOfferAcceptedIndex(
      Math.max(0, visibleOfferAcceptedEvents.length - 1),
    );
  }, [activeOfferAcceptedIndex, visibleOfferAcceptedEvents.length]);

  const showOfferAcceptedBanner =
    !!selectedUser &&
    visibleOfferAcceptedEvents.length > 0 &&
    offerDetailsStatus === "loaded";

  const activeOfferItems = useMemo(() => {
    if (activeOfferDetailsStatus.status !== "loaded") return null;
    return {
      offering: normalizeOfferItems(activeOfferDetailsStatus.data.offering),
      requesting: normalizeOfferItems(activeOfferDetailsStatus.data.requesting),
    };
  }, [activeOfferDetailsStatus]);
  const canMarkOfferComplete = useMemo(() => {
    if (!currentUserId || !activeOfferAccepted) return false;
    const tradeOwnerId = activeOfferAccepted.metadata.trade_user;
    if (typeof tradeOwnerId !== "string" && typeof tradeOwnerId !== "number") {
      return false;
    }
    return asId(tradeOwnerId) === asId(currentUserId);
  }, [activeOfferAccepted, currentUserId]);

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
    routeConversationIdRef.current = routeConversationId;
  }, [routeConversationId]);

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
  }, [currentUserId, userSearchQuery]);

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
  }, [fetchMessagesPage, isLoadingMessages, selectedUserId]);

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
  }, [isLoadingMessages, loadOlderMessages, selectedUserId]);

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
  }, [currentUserId, fetchMessagesPage, isAuthenticated, selectedUserId]);

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
    upsertLocalThreadMessage,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      return;
    }

    const handleRealtimeMessage = (event: Event) => {
      const detail = (event as CustomEvent<RealtimeMessageEventDetail>).detail;
      const action = detail?.action;
      const payload = detail?.data;

      if (
        (action !== "message_received" &&
          action !== "message_sent" &&
          action !== "message_edited" &&
          action !== "message_deleted") ||
        !payload ||
        typeof payload.id !== "string" ||
        typeof payload.user_id !== "string" ||
        typeof payload.recipient_id !== "string" ||
        (payload.parent_id !== undefined &&
          payload.parent_id !== null &&
          typeof payload.parent_id !== "string") ||
        (action !== "message_deleted" && typeof payload.content !== "string")
      ) {
        return;
      }

      // Guard against duplicate realtime events (can happen in dev/strict-mode
      // or if multiple WS connections/event listeners exist briefly).
      {
        const now = Date.now();
        const key = `${action}:${payload.id}`;
        const recent = recentRealtimeEventKeysRef.current;
        const lastSeen = recent.get(key);
        if (typeof lastSeen === "number" && now - lastSeen < 2000) {
          return;
        }
        recent.set(key, now);
        // prune old keys
        for (const [k, t] of recent) {
          if (now - t > 10_000) {
            recent.delete(k);
          }
        }
      }

      const senderId = asId(payload.user_id);
      const receiverId = asId(payload.recipient_id);
      if (senderId !== currentUserId && receiverId !== currentUserId) {
        return;
      }

      const counterpartId = senderId === currentUserId ? receiverId : senderId;
      const messageId = asId(payload.id);

      if (action === "message_deleted") {
        removeLocalThreadMessage(counterpartId, (m) => m.id === messageId);
        setConversations((prev) => {
          const local =
            localThreadMessagesByUserIdRef.current.get(counterpartId) ?? [];
          const latestLocalMessage = getLatestMessage(local);
          const updated = prev.map((conversation) =>
            conversation.user.id === counterpartId &&
            conversation.lastMessage?.id === messageId
              ? { ...conversation, lastMessage: latestLocalMessage }
              : conversation,
          );
          return sortConversationsByLatestMessage(updated);
        });
        if (selectedUserIdRef.current === counterpartId) {
          setMessages((prev) => {
            const next = prev.filter((m) => m.id !== messageId);
            const latestThreadMessage = getLatestMessage(next);
            setConversations((conversationsPrev) => {
              const updated = conversationsPrev.map((conversation) =>
                conversation.user.id === counterpartId &&
                conversation.lastMessage?.id === messageId
                  ? { ...conversation, lastMessage: latestThreadMessage }
                  : conversation,
              );
              return sortConversationsByLatestMessage(updated);
            });
            return next;
          });
          setReplyingToMessage((prev) =>
            prev?.id === messageId ? null : prev,
          );
        }
        return;
      }

      const parentId = payload.parent_id ? asId(payload.parent_id) : null;
      const content = payload.content as string;

      if (action === "message_edited") {
        const editedAt = Date.now();
        updateLocalThreadMessage(
          counterpartId,
          (m) => m.id === messageId,
          (m) => ({
            ...m,
            parentId,
            content,
            updatedAt: editedAt,
          }),
        );
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.user.id === counterpartId &&
            conversation.lastMessage?.id === messageId
              ? {
                  ...conversation,
                  lastMessage: {
                    ...conversation.lastMessage,
                    parentId,
                    content,
                    updatedAt: editedAt,
                  },
                }
              : conversation,
          ),
        );
        if (selectedUserIdRef.current === counterpartId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, parentId, content, updatedAt: editedAt }
                : m,
            ),
          );
        }
        return;
      }

      const realtimeMessage: Message = {
        id: messageId,
        parentId,
        senderId,
        receiverId,
        content,
        metadata:
          payload.metadata && typeof payload.metadata === "object"
            ? (payload.metadata as Record<string, unknown>)
            : null,
        createdAt: Date.now(),
        status: "sent",
      };

      const isOwnSend =
        action === "message_sent" && asId(senderId) === asId(currentUserId);

      if (isOwnSend) {
        const metadata =
          payload.metadata && typeof payload.metadata === "object"
            ? (payload.metadata as Record<string, unknown>)
            : null;
        const clientIdFromMetadata =
          metadata && typeof metadata.client_id === "string"
            ? metadata.client_id
            : null;

        let matchedLocal = false;
        if (clientIdFromMetadata) {
          updateLocalThreadMessage(
            counterpartId,
            (m) => m.clientId === clientIdFromMetadata,
            (m) => ({
              ...m,
              id: realtimeMessage.id,
              parentId: m.parentId ?? realtimeMessage.parentId ?? null,
              content: realtimeMessage.content,
              status: "sent",
            }),
          );
          matchedLocal = (
            localThreadMessagesByUserIdRef.current.get(counterpartId) ?? []
          ).some((m) => m.id === realtimeMessage.id);
        }

        if (!matchedLocal) {
          const now = Date.now();
          const maxAgeMs = 30_000;
          updateLocalThreadMessage(
            counterpartId,
            (m) => {
              if (m.status !== "pending") return false;
              if (asId(m.senderId) !== asId(senderId)) return false;
              if (asId(m.receiverId) !== asId(receiverId)) return false;
              if ((m.parentId ?? null) !== (realtimeMessage.parentId ?? null))
                return false;
              if (m.content !== realtimeMessage.content) return false;
              const createdAt = m.createdAt ?? 0;
              if (!createdAt) return false;
              return now - createdAt <= maxAgeMs;
            },
            (m) => ({ ...m, id: realtimeMessage.id, status: "sent" }),
          );
          matchedLocal = (
            localThreadMessagesByUserIdRef.current.get(counterpartId) ?? []
          ).some((m) => m.id === realtimeMessage.id);
        }

        if (!matchedLocal) {
          upsertLocalThreadMessage(counterpartId, realtimeMessage);
        }
      } else {
        upsertLocalThreadMessage(counterpartId, realtimeMessage);
      }

      if (selectedUserIdRef.current !== counterpartId) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.user.id === counterpartId
              ? { ...conversation, lastMessage: realtimeMessage }
              : conversation,
          ),
        );
        return;
      }

      setMessages((prev) => {
        const existing = prev.find((item) => item.id === realtimeMessage.id);
        if (existing) {
          return prev.map((item) =>
            item.id === realtimeMessage.id
              ? {
                  ...item,
                  parentId: item.parentId ?? realtimeMessage.parentId ?? null,
                  content: realtimeMessage.content,
                  status: "sent",
                }
              : item,
          );
        }

        if (isOwnSend) {
          const metadata =
            payload.metadata && typeof payload.metadata === "object"
              ? (payload.metadata as Record<string, unknown>)
              : null;
          const clientIdFromMetadata =
            metadata && typeof metadata.client_id === "string"
              ? metadata.client_id
              : null;

          if (clientIdFromMetadata) {
            const idx = prev.findIndex(
              (item) => item.clientId === clientIdFromMetadata,
            );
            if (idx !== -1) {
              return prev.map((item, i) =>
                i === idx
                  ? { ...item, id: realtimeMessage.id, status: "sent" }
                  : item,
              );
            }
          }

          const now = Date.now();
          const maxAgeMs = 30_000;
          const pendingIndex = [...prev].reverse().findIndex((item) => {
            if (item.status !== "pending") return false;
            if (asId(item.senderId) !== asId(senderId)) return false;
            if (asId(item.receiverId) !== asId(receiverId)) return false;
            if ((item.parentId ?? null) !== (realtimeMessage.parentId ?? null))
              return false;
            if (item.content !== realtimeMessage.content) return false;
            const createdAt = item.createdAt ?? 0;
            if (!createdAt) return false;
            return now - createdAt <= maxAgeMs;
          });

          if (pendingIndex !== -1) {
            const indexFromStart = prev.length - 1 - pendingIndex;
            return prev.map((item, idx) =>
              idx === indexFromStart
                ? { ...item, id: realtimeMessage.id, status: "sent" }
                : item,
            );
          }
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
  }, [
    currentUserId,
    isAuthenticated,
    updateLocalThreadMessage,
    upsertLocalThreadMessage,
    removeLocalThreadMessage,
  ]);

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

      const { url: blockUrl, headers: blockHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(targetUserId)}/block`,
      );
      const response = await fetch(blockUrl, {
        method: shouldBlock ? "POST" : "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: blockHeaders,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error(shouldBlock ? "block user failed" : "unblock user failed", {
          status: response.status,
          body,
        });
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

  const handleSendMessage = async (rawMessage: string) => {
    if (!selectedUserId || !selectedUser) return;
    if (!currentUser) {
      toast.info("You need to be logged in to send messages");
      return;
    }

    const targetUserId = selectedUserId;
    const targetUser = selectedUser;
    const replyTarget = replyingToMessage;

    const apiContent = prepareMessageContentForApi(rawMessage);
    const displayContent = prepareMessageDisplayContent(rawMessage);
    if (!apiContent || isSending) return;
    if (apiContent.length > MESSAGE_CHAR_LIMIT) {
      toast.error(`Message too long (max ${MESSAGE_CHAR_LIMIT} characters).`);
      return;
    }

    const optimisticId = createClientMessageId();
    const optimisticMessage: Message = {
      id: optimisticId,
      clientId: optimisticId,
      parentId: replyTarget ? replyTarget.id : null,
      senderId: asId(currentUser.id),
      receiverId: asId(targetUserId),
      content: displayContent,
      metadata: { client_id: optimisticId },
      createdAt: Date.now(),
      status: "pending",
    };

    try {
      setIsSending(true);
      pendingOwnSendScrollRef.current = true;
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      upsertLocalThreadMessage(targetUserId, optimisticMessage);
      setMessages((prev) =>
        sortMessagesByCreatedAt([...prev, optimisticMessage]),
      );
      setConversations((prev) => [
        { user: targetUser, lastMessage: optimisticMessage },
        ...prev.filter((item) => item.user.id !== targetUserId),
      ]);
      setReplyingToMessage(null);

      const body: Record<string, unknown> = { content: apiContent };
      if (replyTarget) {
        body.parent_id = replyTarget.id;
      }
      body.metadata = { client_id: optimisticId };

      const { url: sendUrl, headers: sendHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(targetUserId)}`,
      );
      const response = await fetch(sendUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          ...sendHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

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
        response.status === 401
          ? "Unauthorized"
          : response.status === 429
            ? getRateLimitMessage()
            : "Failed to send message";

      if (!response.ok || !parsedBody?.success || !parsedBody.message) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          showBanToast(ban);
          return;
        }
        if (parsedBody?.error === "unmessageable") {
          const apiProvidedSystemMessage =
            parsedBody?.message && typeof parsedBody.message === "string"
              ? parsedBody.message.trim()
              : "";
          const systemContent =
            parsedBody?.reason === "not_mutual"
              ? "You and this user must follow each other to send and receive direct messages."
              : parsedBody?.reason === "blocked"
                ? "Your message could not be delivered. You are blocked from messaging this user."
                : parsedBody?.reason === "self" && apiProvidedSystemMessage
                  ? apiProvidedSystemMessage
                  : apiProvidedSystemMessage ||
                    "Your message could not be delivered.";
          toast.error(systemContent);
          const optimisticCreatedAt = optimisticMessage.createdAt ?? Date.now();
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            senderId: "system",
            receiverId: asId(targetUserId),
            content: systemContent,
            createdAt: Math.max(Date.now(), optimisticCreatedAt + 1),
            type: "system",
          };
          updateLocalThreadMessage(
            targetUserId,
            (m) => m.id === optimisticId,
            (m) => ({ ...m, status: "failed" as const }),
          );
          upsertLocalThreadMessage(targetUserId, systemMessage);
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.user.id === targetUserId
                ? { ...conversation, lastMessage: systemMessage }
                : conversation,
            ),
          );

          if (selectedUserIdRef.current === targetUserId) {
            setMessages((prev) =>
              sortMessagesByCreatedAt([
                ...prev.map((m) =>
                  m.id === optimisticId
                    ? { ...m, status: "failed" as const }
                    : m,
                ),
                systemMessage,
              ]),
            );
          }
          return;
        }

        throw new Error(
          combinedTooLongMessage || apiErrorMessage || fallbackStatusMessage,
        );
      }

      const serverMessageId = asId(parsedBody.message.id);
      const parentId = parsedBody.message.parent_id
        ? asId(parsedBody.message.parent_id)
        : null;
      const resolvedParticipants = resolveMessageParticipants({
        senderCandidate: parsedBody.message.user_id,
        receiverCandidate: parsedBody.message.recipient_id,
        fallbackSenderId: optimisticMessage.senderId,
        fallbackReceiverId: optimisticMessage.receiverId,
      });
      const shouldStayPending = isRealtimeConnected;
      const updatedLastMessage: Message = {
        ...optimisticMessage,
        id: serverMessageId,
        parentId,
        senderId: resolvedParticipants?.senderId ?? optimisticMessage.senderId,
        receiverId:
          resolvedParticipants?.receiverId ?? optimisticMessage.receiverId,
        content: parsedBody.message.content,
        status: shouldStayPending ? "pending" : "sent",
      };
      updateLocalThreadMessage(
        targetUserId,
        (m) => m.id === optimisticId,
        () => updatedLastMessage,
      );

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === targetUserId
            ? { ...conversation, lastMessage: updatedLastMessage }
            : conversation,
        ),
      );

      if (selectedUserIdRef.current === targetUserId) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === serverMessageId)) {
            return prev.filter((item) => item.id !== optimisticId);
          }

          return prev.map((item) =>
            item.id === optimisticId
              ? {
                  ...item,
                  id: serverMessageId,
                  parentId,
                  senderId:
                    resolvedParticipants?.senderId ??
                    optimisticMessage.senderId,
                  receiverId:
                    resolvedParticipants?.receiverId ??
                    optimisticMessage.receiverId,
                  content: parsedBody.message.content,
                  status: shouldStayPending ? "pending" : "sent",
                }
              : item,
          );
        });
      }

      if (shouldStayPending) {
        const timeoutId = window.setTimeout(() => {
          wsSendFallbackTimeoutsRef.current.delete(timeoutId);
          updateLocalThreadMessage(
            targetUserId,
            (m) => m.id === serverMessageId,
            (m) => (m.status === "pending" ? { ...m, status: "sent" } : m),
          );
          if (selectedUserIdRef.current !== targetUserId) {
            return;
          }
          setMessages((prev) =>
            prev.map((item) =>
              item.id === serverMessageId && item.status === "pending"
                ? { ...item, status: "sent" }
                : item,
            ),
          );
        }, WS_SEND_FALLBACK_MS);
        wsSendFallbackTimeoutsRef.current.add(timeoutId);
      }
    } catch (error) {
      pendingOwnSendScrollRef.current = false;
      log.error("Error sending message:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to send message";
      updateLocalThreadMessage(
        targetUserId,
        (m) => m.id === optimisticId,
        (m) => ({ ...m, status: "failed" }),
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === targetUserId &&
          conversation.lastMessage?.id === optimisticId
            ? {
                ...conversation,
                lastMessage: { ...conversation.lastMessage, status: "failed" },
              }
            : conversation,
        ),
      );
      if (selectedUserIdRef.current === targetUserId) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === optimisticId ? { ...item, status: "failed" } : item,
          ),
        );
      }
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    const apiContent = prepareMessageContentForApi(editContent);
    const displayContent = prepareMessageDisplayContent(editContent);
    if (!apiContent || !selectedUserId || isSending) return;

    const originalMessage = messages.find((m) => m.id === messageId);
    if (originalMessage?.content === displayContent) {
      setEditingMessageId(null);
      setEditContent("");
      return;
    }

    let toastId: string | number | undefined;
    try {
      setIsSending(true);
      toastId = toast.loading("Saving changes...");
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const { url: editUrl, headers: editHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(selectedUserId)}/${encodeURIComponent(messageId)}`,
      );
      const response = await fetch(editUrl, {
        method: "PATCH",
        credentials: "include",
        headers: {
          ...editHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: apiContent }),
      });

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

      if (!response.ok || !parsedBody?.success) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          toast.dismiss(toastId);
          showBanToast(ban);
          return;
        }
        const apiErrorMessage =
          parsedBody?.message && typeof parsedBody.message === "string"
            ? parsedBody.message
            : parsedBody?.detail && typeof parsedBody.detail === "string"
              ? parsedBody.detail
              : typeof parsedBody?.detail === "object"
                ? parsedBody.detail.message
                : rawBody.trim() || "Failed to edit message";
        throw new Error(apiErrorMessage);
      }

      const resolvedParticipants = resolveMessageParticipants({
        senderCandidate: parsedBody.message?.user_id,
        receiverCandidate: parsedBody.message?.recipient_id,
        fallbackSenderId: originalMessage?.senderId ?? null,
        fallbackReceiverId: originalMessage?.receiverId ?? null,
      });

      const updatedMessage: Message = {
        id: asId(parsedBody.message?.id ?? messageId),
        parentId: originalMessage?.parentId,
        senderId:
          resolvedParticipants?.senderId ??
          asId(parsedBody.message?.user_id ?? originalMessage?.senderId),
        receiverId:
          resolvedParticipants?.receiverId ??
          asId(parsedBody.message?.recipient_id ?? originalMessage?.receiverId),
        content: parsedBody.message?.content ?? displayContent,
        createdAt: originalMessage?.createdAt,
        updatedAt: parsedBody.message?.updated_at
          ? normalizeTimestamp(parsedBody.message.updated_at)
          : Date.now(),
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updatedMessage : m)),
      );
      updateLocalThreadMessage(
        selectedUserId,
        (m) => m.id === messageId,
        () => updatedMessage,
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === selectedUserId &&
          conversation.lastMessage?.id === messageId
            ? { ...conversation, lastMessage: updatedMessage }
            : conversation,
        ),
      );

      setEditingMessageId(null);
      setEditContent("");
      toast.success("Message edited", { id: toastId });
    } catch (error) {
      log.error("Error editing message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to edit message",
        { id: toastId },
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    skipConfirmation = false,
  ) => {
    if (!selectedUserId || isSending) return;

    const deleteTarget = messages.find((m) => m.id === messageId);
    const shouldDeleteLocallyOnly =
      deleteTarget?.id.startsWith("client-") &&
      (deleteTarget.status === "failed" || deleteTarget.status === "pending");
    const effectiveSkipConfirmation =
      skipConfirmation || shouldDeleteLocallyOnly;

    if (!effectiveSkipConfirmation && deletingMessageId !== messageId) {
      setDeletingMessageId(messageId);
      return;
    }

    let toastId: string | number | undefined;
    // Keep a copy of current messages for restoration if delete fails
    const previousMessages = [...messages];
    const previousConversationLastMessage = conversations.find(
      (conversation) => conversation.user.id === selectedUserId,
    )?.lastMessage;
    // Optimistically remove the message from UI
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    removeLocalThreadMessage(selectedUserId, (m) => m.id === messageId);
    setConversations((prev) => {
      const nextMessages = previousMessages.filter((m) => m.id !== messageId);
      const latestThreadMessage = getLatestMessage(nextMessages);
      const updated = prev.map((conversation) =>
        conversation.user.id === selectedUserId &&
        conversation.lastMessage?.id === messageId
          ? { ...conversation, lastMessage: latestThreadMessage }
          : conversation,
      );
      return sortConversationsByLatestMessage(updated);
    });
    setReplyingToMessage((prev) => (prev?.id === messageId ? null : prev));
    setDeletingMessageId(null);

    try {
      if (shouldDeleteLocallyOnly) {
        return;
      }
      toastId = toast.loading("Deleting message...");
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const { url: deleteUrl, headers: deleteHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(selectedUserId)}/${encodeURIComponent(messageId)}`,
      );
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        credentials: "include",
        headers: deleteHeaders,
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          toast.dismiss(toastId);
          showBanToast(ban);
          throw new BanError();
        }
        throw new Error(
          await getResponseErrorMessage(response, "Failed to delete message"),
        );
      }

      toast.success("Message deleted", { id: toastId });
    } catch (error) {
      // If deletion failed, restore the previous state
      setMessages(previousMessages);
      const existingLocal =
        localThreadMessagesByUserIdRef.current.get(selectedUserId) ?? [];
      const prevIds = new Set(previousMessages.map((m) => m.id));
      localThreadMessagesByUserIdRef.current.set(
        selectedUserId,
        trimLocalThreadMessages([
          ...previousMessages,
          ...existingLocal.filter((m) => !prevIds.has(m.id)),
        ]),
      );
      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          conversation.user.id === selectedUserId
            ? { ...conversation, lastMessage: previousConversationLastMessage }
            : conversation,
        );
        return sortConversationsByLatestMessage(updated);
      });
      log.error("Error deleting message:", error);
      if (!(error instanceof BanError)) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete message",
          { id: toastId },
        );
      }
    }
  };

  const handleRetryFailedMessage = async (failedMessage: Message) => {
    if (isSending) return;
    if (failedMessage.status !== "failed") return;
    if (!failedMessage.content?.trim()) return;

    await handleDeleteMessage(failedMessage.id, true);
    await handleSendMessage(failedMessage.content);
  };

  const handleReportMessage = async () => {
    if (!reportingMessage || !selectedUserId || !reportReason.trim()) return;
    if (!PUBLIC_API_URL) {
      toast.error("API URL is not configured");
      return;
    }

    setIsSubmittingReport(true);
    const toastId = toast.loading("Submitting report...");

    try {
      const { url: reportUrl, headers: reportHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(selectedUserId)}/${encodeURIComponent(reportingMessage.id)}/report`,
      );
      const response = await fetch(reportUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...reportHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          toast.dismiss(toastId);
          showBanToast(ban);
          return;
        }
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setReportingMessage(null);
      setReportReason("");
    } catch (error) {
      log.error("Error reporting message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-5rem)] overflow-hidden px-4 pb-4">
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
      <div className="h-[calc(100dvh-5rem)] overflow-hidden px-4 pb-4">
        <div className="flex h-full min-h-0 flex-col">
          <Breadcrumb containerClassName="py-4" />
          <div className="border-border-card bg-secondary-bg mt-0 flex min-h-0 w-full flex-1 items-center justify-center rounded-lg border p-6 shadow-md sm:p-8">
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

  const focusUserSearch = () => {
    if (selectedUserId) {
      goToConversationList();
    }
    requestAnimationFrame(() => {
      userSearchInputRef.current?.focus();
    });
  };

  return (
    <div className="h-[calc(100dvh-5rem)] overflow-hidden">
      <div className="flex h-full min-h-0 flex-col">
        <Breadcrumb containerClassName="px-4 py-4" />

        <div className="bg-secondary-bg border-border-card mx-4 mt-0 grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-lg border lg:grid-cols-[320px_1fr]">
          <aside
            className={cn(
              "border-border-card flex h-full min-h-0 flex-col border-b lg:border-r lg:border-b-0",
              selectedUserId ? "hidden lg:flex" : "",
            )}
          >
            <div className="border-border-card border-b px-4 py-3">
              <p className="text-primary-text text-sm font-semibold">
                {userSearchQuery.trim()
                  ? `${
                      isUserSearchLoading
                        ? ""
                        : `${formatCountCapped(userSearchResults.length)} `
                    }Search Results`
                  : `${formatCountCapped(
                      totalConversations ?? conversations.length,
                    )} Conversations`}
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
                  ref={userSearchInputRef}
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
                  <div className="flex items-center justify-center px-4 py-10">
                    <Spinner className="h-5 w-5" />
                  </div>
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
                        settings={user.settings_v2}
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
                  const isOwnPreview =
                    !!currentUserId &&
                    !!conversation.lastMessage &&
                    conversation.lastMessage.type !== "system" &&
                    conversation.lastMessage.senderId === currentUserId;
                  const previewText = conversation.lastMessage
                    ? conversation.lastMessage.type === "system"
                      ? formatSystemMessageContent(
                          conversation.lastMessage,
                          currentUserId,
                          conversation.user,
                        )
                      : isOwnPreview
                        ? `You: ${conversation.lastMessage.content}`
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
                        settings={conversation.user.settings_v2}
                        premiumType={conversation.user.premiumtype}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-primary-text min-w-0 truncate text-sm font-medium",
                              isActive ? "text-link" : "",
                            )}
                          >
                            {getDisplayName(conversation.user)}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <ConversationRowTime
                              timestamp={conversation.lastMessage?.createdAt}
                              cacheKey={`conversation-row-${conversation.user.id}-${conversation.lastMessage?.id ?? "none"}`}
                            />
                          </div>
                        </div>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                          <p className="text-secondary-text min-w-0 truncate text-xs">
                            {twemojiEnabled ? (
                              <Twemoji
                                tag="span"
                                options={{ className: "twemoji" }}
                              >
                                {formatMessageText(previewText)}
                              </Twemoji>
                            ) : (
                              formatMessageText(previewText)
                            )}
                          </p>
                        </div>
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
                    <Button onClick={focusUserSearch}>
                      Start a conversation
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Chat className="h-full min-h-0">
                <ChatHeader
                  className={cn(
                    "border-border-card px-4 py-3",
                    showOfferAcceptedBanner ? "" : "border-b",
                  )}
                >
                  <ChatHeaderAddon>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={goToConversationList}
                      aria-label="Open conversations"
                    >
                      <svg
                        className="text-primary-text h-5 w-5 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        aria-hidden="true"
                      >
                        <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                      </svg>
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
                        settings={selectedUser.settings_v2}
                        premiumType={selectedUser.premiumtype}
                      />
                    </Link>
                  </ChatHeaderAddon>
                  <ChatHeaderMain>
                    <div className="flex min-w-0 flex-col">
                      <Link
                        href={`/users/${selectedUser.id}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link cursor-pointer truncate text-left text-base font-semibold transition-colors sm:text-lg"
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
                              <Spinner className="h-3 w-3" />
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
                          className="!size-8 sm:!size-10"
                          aria-label="Conversation actions"
                        >
                          <Icon
                            icon="heroicons:ellipsis-horizontal"
                            className="!size-4 sm:!size-5"
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

                {showOfferAcceptedBanner ? (
                  <div className="border-border-card bg-tertiary-bg border-b px-4 py-2">
                    <div className="border-link bg-button-info/10 grid grid-cols-1 gap-3 rounded-l-none rounded-r-md border-l-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                      <div className="min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-primary-text truncate text-sm font-semibold">
                            <span className="sm:hidden">Offer accepted</span>
                            <span className="hidden sm:inline">
                              Trade offer accepted
                            </span>
                          </p>
                          {activeOfferDetailsStatus.status === "loaded" ? (
                            <button
                              type="button"
                              aria-label={
                                isOfferBannerMinimized
                                  ? "Show trade details"
                                  : "Hide trade details"
                              }
                              aria-pressed={!isOfferBannerMinimized}
                              onClick={() =>
                                setIsOfferBannerMinimized((prev) => !prev)
                              }
                              className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                              <Icon
                                icon={
                                  isOfferBannerMinimized
                                    ? "heroicons:chevron-down"
                                    : "heroicons:chevron-up"
                                }
                                className="h-5 w-5"
                              />
                            </button>
                          ) : null}
                        </div>
                        {activeOfferDetailsStatus.status === "loading" ? (
                          <p className="text-secondary-text flex items-center gap-2 text-xs">
                            <Spinner className="h-3.5 w-3.5" />
                            Loading offer details…
                          </p>
                        ) : activeOfferDetailsStatus.status === "loaded" ? (
                          <>
                            {isOfferBannerMinimized ? (
                              <>
                                {currentUserEnriched && selectedUser ? (
                                  <div className="mt-1 flex items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <UserAvatar
                                        userId={currentUserEnriched.id}
                                        avatarHash={currentUserEnriched.avatar}
                                        username={getDisplayName(
                                          currentUserEnriched,
                                        )}
                                        custom_avatar={
                                          currentUserEnriched.custom_avatar
                                        }
                                        settings={
                                          currentUserEnriched.settings_v2
                                        }
                                        premiumType={
                                          currentUserEnriched.premiumtype
                                        }
                                        showBadge={false}
                                        size={5}
                                      />
                                      <Icon
                                        icon="heroicons:arrows-right-left"
                                        className="text-secondary-text h-4 w-4"
                                      />
                                      <UserAvatar
                                        userId={selectedUser.id}
                                        avatarHash={selectedUser.avatar}
                                        username={getDisplayName(selectedUser)}
                                        custom_avatar={
                                          selectedUser.custom_avatar
                                        }
                                        settings={selectedUser.settings_v2}
                                        premiumType={selectedUser.premiumtype}
                                        showBadge={false}
                                        size={5}
                                      />
                                    </div>
                                    <p className="text-secondary-text min-w-0 truncate text-xs tabular-nums">
                                      Offer{" "}
                                      <span className="text-primary-text/80">
                                        #{activeOfferDetailsStatus.data.id}
                                      </span>{" "}
                                      • Trade{" "}
                                      <span className="text-primary-text/80">
                                        #{activeOfferDetailsStatus.data.trade}
                                      </span>
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-secondary-text mt-1 text-xs tabular-nums">
                                    Offer{" "}
                                    <span className="text-primary-text/80">
                                      #{activeOfferDetailsStatus.data.id}
                                    </span>{" "}
                                    • Trade{" "}
                                    <span className="text-primary-text/80">
                                      #{activeOfferDetailsStatus.data.trade}
                                    </span>
                                  </p>
                                )}
                                <p className="text-secondary-text mt-1 truncate text-xs">
                                  Offering:{" "}
                                  <span className="text-primary-text/80">
                                    {formatOfferItemSummary(
                                      activeOfferItems?.offering ?? [],
                                    )}
                                  </span>{" "}
                                  • Requesting:{" "}
                                  <span className="text-primary-text/80">
                                    {formatOfferItemSummary(
                                      activeOfferItems?.requesting ?? [],
                                    )}
                                  </span>
                                </p>
                                {activeOfferDetailsStatus.data.note ? (
                                  <p className="text-secondary-text mt-1 truncate text-xs">
                                    Note:{" "}
                                    <span className="text-primary-text/70">
                                      {formatMessageText(
                                        activeOfferDetailsStatus.data.note,
                                      )}
                                    </span>
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <OfferItems
                                  label="Offering"
                                  items={activeOfferItems?.offering ?? []}
                                  expanded={true}
                                  display="text"
                                  maxCollapsed={Number.MAX_SAFE_INTEGER}
                                />
                                <OfferItems
                                  label="Requesting"
                                  items={activeOfferItems?.requesting ?? []}
                                  expanded={true}
                                  display="text"
                                  maxCollapsed={Number.MAX_SAFE_INTEGER}
                                />
                              </div>
                            )}
                          </>
                        ) : activeOfferDetailsStatus.status === "not_found" ? (
                          <p className="text-secondary-text truncate text-xs">
                            This trade offer no longer exists.
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
                              visibleOfferAcceptedEvents.length,
                            )}{" "}
                            / {visibleOfferAcceptedEvents.length}
                          </span>
                          <button
                            type="button"
                            aria-label="Next accepted offer"
                            disabled={
                              activeOfferAcceptedIndex >=
                              visibleOfferAcceptedEvents.length - 1
                            }
                            onClick={() =>
                              setActiveOfferAcceptedIndex((prev) =>
                                Math.min(
                                  prev + 1,
                                  visibleOfferAcceptedEvents.length - 1,
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
                                    visibleOfferAcceptedEvents[
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

                                      const key = getOfferDetailsKey(
                                        active.metadata,
                                      );
                                      setOfferDetailsMap((prev) => ({
                                        ...prev,
                                        [key]: prev[key]
                                          ? {
                                              ...(prev[
                                                key
                                              ] as TradeOfferDetails),
                                              status: 3,
                                            }
                                          : null,
                                      }));
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
                            className="border-link bg-button-info/10 my-0.5 items-start rounded-l-none rounded-r-md border-l-2 py-0.5 pl-2"
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
                                    format="discord"
                                    className="text-secondary-text text-xs"
                                  />
                                )}
                              </ChatEventTitle>
                              <ChatEventContent className="text-primary-text wrap-break-word whitespace-pre-wrap">
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
                      const domId = getMessageDomId(message);
                      const previousMessage = messages[index - 1];
                      const isGroupedWithPrevious = (() => {
                        if (showDaySeparator) return false;
                        if (!previousMessage) return false;
                        if (message.parentId) return false;
                        if (previousMessage.type === "system") return false;
                        if (
                          typeof message.createdAt !== "number" ||
                          typeof previousMessage.createdAt !== "number"
                        ) {
                          return false;
                        }
                        if (asId(previousMessage.senderId) !== senderId) {
                          return false;
                        }
                        const minute = Math.floor(message.createdAt / 60_000);
                        const prevMinute = Math.floor(
                          previousMessage.createdAt / 60_000,
                        );
                        return minute === prevMinute;
                      })();

                      const isMessageMenuActive =
                        activeMessageId === message.id;

                      const renderMenuItems = (
                        Item: React.ComponentType<{
                          onClick?: React.MouseEventHandler;
                          className?: string;
                          children?: React.ReactNode;
                        }>,
                        skipShiftKey = false,
                      ) => (
                        <>
                          {message.status !== "failed" && (
                            <Item onClick={() => setReplyingToMessage(message)}>
                              <Icon
                                icon="heroicons-outline:reply"
                                className="mr-2 h-4 w-4"
                              />
                              Reply
                            </Item>
                          )}
                          {!isOwnMessage && message.status !== "failed" && (
                            <Item
                              onClick={() => {
                                setReportingMessage(message);
                                setReportReason("");
                              }}
                              className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger"
                            >
                              <Icon
                                icon="heroicons-outline:flag"
                                className="mr-2 h-4 w-4"
                              />
                              Report Message
                            </Item>
                          )}
                          {isOwnMessage && message.status !== "failed" && (
                            <>
                              <Item
                                onClick={() => {
                                  setEditingMessageId(message.id);
                                  setEditContent(message.content);
                                }}
                              >
                                <Icon
                                  icon="heroicons-outline:pencil"
                                  className="mr-2 h-4 w-4"
                                />
                                Edit Message
                              </Item>
                              <Item
                                onClick={(e: React.MouseEvent) =>
                                  void handleDeleteMessage(
                                    message.id,
                                    skipShiftKey ? false : e.shiftKey,
                                  )
                                }
                                className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger"
                              >
                                <Icon
                                  icon="heroicons-outline:trash"
                                  className="mr-2 h-4 w-4"
                                />
                                Delete Message
                              </Item>
                            </>
                          )}
                          {isOwnMessage && message.status === "failed" && (
                            <>
                              <Item
                                onClick={() =>
                                  void handleRetryFailedMessage(message)
                                }
                              >
                                <Icon
                                  icon="lucide:rotate-cw"
                                  className="mr-2 h-4 w-4"
                                />
                                Retry
                              </Item>
                              <Item
                                onClick={() =>
                                  void handleDeleteMessage(message.id, true)
                                }
                                className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger"
                              >
                                <Icon
                                  icon="heroicons-outline:trash"
                                  className="mr-2 h-4 w-4"
                                />
                                Remove
                              </Item>
                            </>
                          )}
                        </>
                      );

                      const messageMenu = (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className={cn(
                                "pointer-events-none !size-7 rounded-lg p-0 opacity-0 transition-all duration-200 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100 sm:!size-8 lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:disabled:opacity-0 lg:group-hover:disabled:opacity-100",
                                isMessageMenuActive &&
                                  "pointer-events-auto opacity-100",
                              )}
                              disabled={
                                isSending ||
                                Boolean(deletingMessageId) ||
                                message.status === "pending"
                              }
                            >
                              <Icon
                                icon="heroicons:ellipsis-horizontal"
                                className="!size-4"
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {renderMenuItems(DropdownMenuItem)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );

                      return (
                        <ContextMenu key={domId}>
                          <ContextMenuTrigger asChild>
                            <div
                              id={`message-${domId}`}
                              className="group"
                              data-message-row
                            >
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
                                  "group-hover:bg-tertiary-bg relative w-full flex-col items-start rounded-md py-0.5 transition-colors",
                                  message.parentId && "mt-0.5",
                                )}
                                onClick={(event) => {
                                  if (editingMessageId) return;
                                  if (message.status === "pending") return;

                                  const target =
                                    event.target as HTMLElement | null;
                                  if (
                                    target?.closest(
                                      "a,button,textarea,input,select,[role='menuitem']",
                                    )
                                  ) {
                                    return;
                                  }

                                  setActiveMessageId((prev) =>
                                    prev === message.id ? null : message.id,
                                  );
                                }}
                              >
                                {message.parentId && (
                                  <div className="-mb-1 flex items-center gap-2 sm:gap-3">
                                    <div className="flex w-10 shrink-0 justify-end @md/chat:w-12">
                                      <div className="border-secondary-text/40 h-3 w-8 translate-x-2 translate-y-2 rounded-tl-md border-t-2 border-l-2" />
                                    </div>
                                    {(() => {
                                      const parentMsg = messages.find(
                                        (m) => m.id === message.parentId,
                                      );
                                      if (!parentMsg) {
                                        return (
                                          <div className="text-secondary-text/80 flex min-w-0 items-center gap-1.5 overflow-hidden rounded px-1 text-xs italic">
                                            This message has been deleted
                                          </div>
                                        );
                                      }
                                      const isParentOwn =
                                        asId(parentMsg.senderId) ===
                                        asId(currentUser?.id);
                                      const parentSender = isParentOwn
                                        ? (currentUserEnriched ??
                                          currentUserMessageUser)
                                        : selectedUser;
                                      const parentDisplayName = parentSender
                                        ? getDisplayName(parentSender)
                                        : "Unknown";
                                      return (
                                        <button
                                          type="button"
                                          className="text-secondary-text/80 flex min-w-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded px-1 text-xs transition-opacity hover:opacity-100"
                                          onClick={() => {
                                            const el = document.getElementById(
                                              `message-${getMessageDomId(parentMsg)}`,
                                            );
                                            const container =
                                              messagesContainerRef.current;
                                            if (el && container) {
                                              const rect =
                                                el.getBoundingClientRect();
                                              const containerRect =
                                                container.getBoundingClientRect();

                                              const isVisible =
                                                rect.top >= containerRect.top &&
                                                rect.bottom <=
                                                  containerRect.bottom;

                                              if (!isVisible) {
                                                const relativeTop =
                                                  el.offsetTop -
                                                  container.offsetTop;
                                                container.scrollTo({
                                                  top:
                                                    relativeTop -
                                                    container.clientHeight / 2 +
                                                    el.clientHeight / 2,
                                                  behavior: "smooth",
                                                });
                                              }
                                              el.classList.add(
                                                "bg-button-info/10",
                                                "transition-colors",
                                                "duration-500",
                                              );
                                              setTimeout(
                                                () =>
                                                  el.classList.remove(
                                                    "bg-button-info/10",
                                                    "transition-colors",
                                                    "duration-500",
                                                  ),
                                                1500,
                                              );
                                            }
                                          }}
                                        >
                                          {parentSender && (
                                            <UserAvatar
                                              userId={parentSender.id}
                                              avatarHash={parentSender.avatar}
                                              username={parentSender.username}
                                              custom_avatar={
                                                parentSender.custom_avatar
                                              }
                                              size={4}
                                              showBadge={false}
                                              settings={
                                                parentSender.settings_v2
                                              }
                                              premiumType={
                                                parentSender.premiumtype
                                              }
                                              className="h-4 w-4"
                                            />
                                          )}
                                          <span className="text-primary-text shrink-0 font-semibold">
                                            @{parentDisplayName}
                                          </span>
                                          <span className="text-secondary-text max-w-50 truncate sm:max-w-100">
                                            {formatMessageText(
                                              parentMsg.content,
                                            )}
                                          </span>
                                        </button>
                                      );
                                    })()}
                                  </div>
                                )}
                                <div className="relative flex w-full items-start gap-2">
                                  <ChatEventAddon
                                    className={cn(
                                      isGroupedWithPrevious
                                        ? "justify-end pr-1"
                                        : undefined,
                                    )}
                                  >
                                    {isGroupedWithPrevious ? (
                                      typeof message.createdAt === "number" ? (
                                        <ChatEventTime
                                          timestamp={message.createdAt}
                                          format="time"
                                          className="text-secondary-text invisible text-[10px] group-hover:visible"
                                        />
                                      ) : null
                                    ) : (
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
                                          settings={sender.settings_v2}
                                          premiumType={sender.premiumtype}
                                        />
                                      </Link>
                                    )}
                                  </ChatEventAddon>
                                  <ChatEventBody>
                                    {!isGroupedWithPrevious ? (
                                      <ChatEventTitle className="w-full items-start">
                                        <div className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                                          <Link
                                            href={`/users/${sender.id}`}
                                            prefetch={false}
                                            className="text-primary-text hover:text-link cursor-pointer truncate text-sm font-medium transition-colors sm:text-base"
                                          >
                                            {getDisplayName(sender)}
                                          </Link>
                                          {typeof message.createdAt ===
                                            "number" && (
                                            <ChatEventTime
                                              timestamp={message.createdAt}
                                              format="discord"
                                              className="text-secondary-text text-xs"
                                            />
                                          )}
                                        </div>
                                      </ChatEventTitle>
                                    ) : null}
                                    {editingMessageId === message.id ? (
                                      <div className="mt-2 space-y-2">
                                        <div className="border-border-card bg-tertiary-bg focus-within:border-button-info rounded border transition-colors">
                                          <CommentTextarea
                                            ref={editTextareaRef}
                                            value={editContent}
                                            onChange={setEditContent}
                                            emojiMap={emojiStringMap}
                                            disabled={isSending}
                                            rows={3}
                                            className="text-primary-text placeholder-secondary-text w-full resize-y bg-transparent p-3 text-sm focus:outline-none disabled:opacity-60"
                                            autoCorrect="off"
                                            autoComplete="off"
                                            spellCheck="false"
                                            autoCapitalize="off"
                                            onKeyDown={(e) => {
                                              if (e.key === "Escape") {
                                                setEditingMessageId(null);
                                                setEditContent("");
                                              }
                                              if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                              ) {
                                                e.preventDefault();
                                                void handleEditMessage(
                                                  message.id,
                                                );
                                              }
                                            }}
                                          />
                                          <div className="border-border-card flex items-center justify-between gap-2 border-t px-3 py-2">
                                            <Popover
                                              open={editEmojiOpen}
                                              onOpenChange={setEditEmojiOpen}
                                            >
                                              <Tooltip delayDuration={500}>
                                                <TooltipTrigger asChild>
                                                  <PopoverTrigger asChild>
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-secondary-text hover:text-primary-text h-7 w-7 p-0"
                                                      disabled={isSending}
                                                      onPointerDown={() => {
                                                        editCursorPosRef.current =
                                                          editTextareaRef
                                                            .current
                                                            ?.selectionStart ??
                                                          null;
                                                      }}
                                                    >
                                                      <Icon
                                                        icon="heroicons:face-smile"
                                                        className="h-4 w-4"
                                                      />
                                                    </Button>
                                                  </PopoverTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  Add an emoji
                                                </TooltipContent>
                                              </Tooltip>
                                              <PopoverContent
                                                align="start"
                                                side="top"
                                                sideOffset={8}
                                                className="w-72 p-0"
                                                onOpenAutoFocus={(e) =>
                                                  e.preventDefault()
                                                }
                                              >
                                                <div className="grid max-h-56 grid-cols-8 gap-px overflow-y-auto p-1.5">
                                                  {Object.entries(
                                                    emojiStringMap,
                                                  )
                                                    .slice(0, 120)
                                                    .map(([name, emoji]) => (
                                                      <Tooltip
                                                        key={name}
                                                        delayDuration={0}
                                                      >
                                                        <TooltipTrigger asChild>
                                                          <button
                                                            type="button"
                                                            onClick={(e) =>
                                                              insertEditEmoji(
                                                                emoji,
                                                                e.shiftKey,
                                                              )
                                                            }
                                                            className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-transparent text-lg transition-colors"
                                                          >
                                                            {twemojiEnabled ? (
                                                              <Twemoji
                                                                tag="span"
                                                                options={{
                                                                  className:
                                                                    "twemoji pointer-events-none",
                                                                }}
                                                              >
                                                                {emoji}
                                                              </Twemoji>
                                                            ) : (
                                                              <span className="pointer-events-none">
                                                                {emoji}
                                                              </span>
                                                            )}
                                                          </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          :{name}:
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    ))}
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                            <div className="flex items-center gap-2 lg:hidden">
                                              <Button
                                                size="sm"
                                                className="h-8 px-4 text-xs"
                                                onClick={() =>
                                                  void handleEditMessage(
                                                    message.id,
                                                  )
                                                }
                                                disabled={
                                                  isSending ||
                                                  !editContent.trim()
                                                }
                                              >
                                                {isSending ? (
                                                  <Spinner className="mr-1 h-3 w-3" />
                                                ) : null}
                                                Update
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-secondary-text h-8 px-4 text-xs"
                                                onClick={() => {
                                                  setEditingMessageId(null);
                                                  setEditContent("");
                                                }}
                                                disabled={isSending}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                            <div className="text-secondary-text hidden items-center gap-1 text-[11px] lg:flex">
                                              Esc to{" "}
                                              <button
                                                type="button"
                                                className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                onClick={() => {
                                                  setEditingMessageId(null);
                                                  setEditContent("");
                                                }}
                                                disabled={isSending}
                                              >
                                                cancel
                                              </button>{" "}
                                              • Enter to{" "}
                                              <button
                                                type="button"
                                                className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                onClick={() =>
                                                  void handleEditMessage(
                                                    message.id,
                                                  )
                                                }
                                                disabled={
                                                  isSending ||
                                                  !editContent.trim()
                                                }
                                              >
                                                save
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex w-full items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                          <ChatEventContent
                                            className={cn(
                                              "wrap-break-word whitespace-pre-wrap",
                                              message.status === "pending"
                                                ? "text-secondary-text/70"
                                                : message.status === "failed"
                                                  ? "text-red-400/90"
                                                  : "text-primary-text",
                                            )}
                                          >
                                            {twemojiEnabled ? (
                                              <Twemoji
                                                tag="span"
                                                options={{
                                                  className: "twemoji",
                                                }}
                                              >
                                                {formatMessageText(
                                                  message.content ?? "",
                                                )}
                                              </Twemoji>
                                            ) : (
                                              formatMessageText(
                                                message.content ?? "",
                                              )
                                            )}
                                            {message.updatedAt &&
                                              message.updatedAt !==
                                                message.createdAt && (
                                                <span className="text-secondary-text ml-1.5 text-[10px]">
                                                  (edited)
                                                </span>
                                              )}
                                          </ChatEventContent>
                                        </div>
                                      </div>
                                    )}
                                  </ChatEventBody>
                                  {editingMessageId !== message.id &&
                                    message.status !== "pending" && (
                                      <div className="absolute top-0 right-0 z-10">
                                        {messageMenu}
                                      </div>
                                    )}
                                </div>
                              </ChatEvent>
                            </div>
                          </ContextMenuTrigger>
                          {message.status !== "pending" && (
                            <ContextMenuContent>
                              {renderMenuItems(ContextMenuItem, true)}
                            </ContextMenuContent>
                          )}
                        </ContextMenu>
                      );
                    })
                  )}
                </ChatMessages>

                <div className="bg-secondary-bg border-border-card sticky bottom-0 border-t p-3">
                  {messageBan && (
                    <BanBanner ban={messageBan} className="mb-3" />
                  )}
                  {replyingToMessage && (
                    <div className="bg-tertiary-bg border-border-card flex w-full items-center justify-between rounded-t-md border-x border-t px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Icon
                          icon="heroicons-outline:reply"
                          className="text-secondary-text h-3 w-3 shrink-0"
                        />
                        <span className="text-secondary-text">
                          Replying to{" "}
                          <span className="text-primary-text font-bold">
                            {replyingToMessage.senderId ===
                            asId(currentUser?.id)
                              ? "yourself"
                              : getDisplayName(
                                  replyingToMessage.senderId === selectedUserId
                                    ? selectedUser
                                    : (currentUserEnriched ??
                                        currentUserMessageUser ??
                                        selectedUser),
                                )}
                          </span>
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full p-0"
                        onClick={() => setReplyingToMessage(null)}
                      >
                        <Icon icon="lucide:x" className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div
                    className={cn(
                      "border-border-card bg-tertiary-bg text-primary-text focus-within:border-border-focus flex w-full items-center gap-2 rounded-md border px-1 py-1 shadow-none",
                      replyingToMessage && "rounded-t-none border-t-0",
                    )}
                  >
                    <MessageComposer
                      conversationId={selectedUserId}
                      placeholder={messagePlaceholder}
                      maxChars={MESSAGE_CHAR_LIMIT}
                      isSending={isSending}
                      disabled={!!messageBan || isUnmessageable}
                      onSend={(message) => void handleSendMessage(message)}
                    />
                  </div>
                </div>
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
              className={`mt-1 text-right text-xs ${reportReason.length >= 500 ? "text-red-500" : "text-secondary-text"}`}
            >
              {reportReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
