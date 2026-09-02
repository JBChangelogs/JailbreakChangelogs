import type { UserFlag, UserSettingsV2 } from "@/types/auth";
import type { TradeOfferDetails } from "@/hooks/useOfferDetailsBatch";
import type {
  Message,
  MessageUser,
  OfferAcceptedMetadata,
  OfferItem,
} from "@/utils/messages/types";

export function normalizeTimestamp(timestamp: number): number {
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

export function asId(value: unknown): string {
  return String(value);
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseOfferAcceptedMetadata(
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

export function parseMessageRecord(item: unknown): Message | null {
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

export function resolveMessageParticipants(options: {
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

export function normalizeOfferItems(
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

export function toMessageUser(raw: unknown): MessageUser | null {
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

export function extractItems(data: unknown): unknown[] {
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

export function extractPagination(data: unknown): {
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
