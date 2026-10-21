import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseBan, type BanInfo } from "@/utils/api/ban";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";
import {
  asId,
  parseMessageRecord,
  toMessageUser,
} from "@/utils/messages/parsing";
import type {
  Message,
  MessageUser,
  OutgoingMessageMetadata,
} from "@/utils/messages/types";

/** Most members a group can have, the owner included. */
export const GROUP_MEMBER_LIMIT = 10;
export const GROUP_NAME_MAX = 64;

export interface GroupChat {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  /** In join order; the first becomes owner if the owner leaves. */
  memberIds: string[];
}

export interface GroupChatSummary extends GroupChat {
  unreadCount: number;
  lastMessage: Message | null;
}

export interface GroupMessagesPage {
  messages: Message[];
  page: number;
  totalPages: number;
}

/** An API error, with its code (e.g. "unmessageable") and, for that, who. */
export class GroupChatError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    readonly userId?: string,
    /** Set when a messaging ban blocked it (from the response headers). */
    readonly ban?: BanInfo | null,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Read per call (Next inlines it at build time), so tests can set it.
  const { url, headers } = buildApiFetchRequest(
    process.env.NEXT_PUBLIC_API_URL,
    path,
  );
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });
  const text = await response.text();
  // Snowflake IDs past 2^53 would lose digits as JS numbers.
  const data = (text ? safeParse(text) : {}) as Record<string, unknown>;
  if (!response.ok) {
    throw new GroupChatError(
      response.status,
      typeof data.error === "string" ? data.error : undefined,
      typeof data.message === "string"
        ? data.message
        : `Request failed (${response.status})`,
      data.user_id === undefined ? undefined : asId(data.user_id),
      parseBan(response),
    );
  }
  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return parseJsonWithLargeIds(text);
  } catch {
    return {};
  }
}

const seconds = (value: unknown) =>
  typeof value === "number" ? (value < 1e12 ? value * 1000 : value) : 0;

export function parseGroup(raw: unknown): GroupChat | null {
  if (!raw || typeof raw !== "object") return null;
  const group = raw as Record<string, unknown>;
  if (group.id === undefined || typeof group.name !== "string") return null;
  return {
    id: asId(group.id),
    name: group.name,
    ownerId: asId(group.owner_id),
    createdAt: seconds(group.created_at),
    memberIds: Array.isArray(group.member_ids)
      ? group.member_ids.map(asId)
      : [],
  };
}

/** A group message as the shared Message type; the group is its receiver. */
export function parseGroupMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== "object") return null;
  const message = raw as Record<string, unknown>;
  return parseMessageRecord({ ...message, receiver_id: message.group_id });
}

const groupPath = (id: string) => `/v2/group-chats/${encodeURIComponent(id)}`;
const json = (body: unknown) => JSON.stringify(body);

export async function fetchGroupChats(): Promise<GroupChatSummary[]> {
  const data = await request<{ groups?: unknown[] }>("/v2/group-chats");
  return (data.groups ?? []).flatMap((raw) => {
    const group = parseGroup(raw);
    if (!group) return [];
    const record = raw as Record<string, unknown>;
    return [
      {
        ...group,
        unreadCount:
          typeof record.unread_count === "number" ? record.unread_count : 0,
        lastMessage: parseGroupMessage(record.message),
      },
    ];
  });
}

const toGroup = (raw: unknown) => {
  const group = parseGroup(raw);
  if (!group) throw new Error("Unexpected response from the server");
  return group;
};

export const fetchGroupChat = async (id: string) =>
  toGroup(await request(groupPath(id)));

export const createGroupChat = async (name: string, memberIds: string[]) =>
  toGroup(
    await request("/v2/group-chats", {
      method: "POST",
      body: json({ name, member_ids: memberIds }),
    }),
  );

export const renameGroupChat = async (id: string, name: string) =>
  toGroup(
    await request(groupPath(id), { method: "PATCH", body: json({ name }) }),
  );

export const deleteGroupChat = (id: string) =>
  request(groupPath(id), { method: "DELETE" });

export const addGroupMembers = async (id: string, memberIds: string[]) =>
  toGroup(
    await request(`${groupPath(id)}/members`, {
      method: "POST",
      body: json({ member_ids: memberIds }),
    }),
  );

/** Your own id leaves; only the owner can remove others. */
export const removeGroupMember = (id: string, userId: string) =>
  request(`${groupPath(id)}/members/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });

/** Newest first, 50 a page. Loading page 1 marks the group read. */
export async function fetchGroupMessages(
  id: string,
  page: number,
): Promise<GroupMessagesPage> {
  const data = await request<{
    items?: unknown[];
    page?: number;
    total_pages?: number;
  }>(`${groupPath(id)}/messages?page=${page}`);
  return {
    messages: (data.items ?? []).flatMap((raw) => {
      const message = parseGroupMessage(raw);
      return message ? [message] : [];
    }),
    page: data.page ?? page,
    totalPages: data.total_pages ?? page,
  };
}

export async function sendGroupMessage(
  id: string,
  content: string,
  parentId?: string | null,
  metadata?: OutgoingMessageMetadata,
): Promise<Message> {
  const data = await request<{ message?: unknown }>(
    `${groupPath(id)}/messages`,
    {
      method: "POST",
      body: json({
        content,
        ...(parentId ? { parent_id: parentId } : {}),
        ...(metadata ? { metadata } : {}),
      }),
    },
  );
  const message = parseGroupMessage(data.message);
  if (!message) throw new Error("Unexpected response from the server");
  return message;
}

const messagePath = (id: string, messageId: string) =>
  `${groupPath(id)}/messages/${encodeURIComponent(messageId)}`;

export const editGroupMessage = (
  id: string,
  messageId: string,
  content: string,
) =>
  request(messagePath(id, messageId), {
    method: "PATCH",
    body: json({ content }),
  });

/** The sender, or the group owner for anyone's message. */
export const deleteGroupMessage = (id: string, messageId: string) =>
  request(messagePath(id, messageId), { method: "DELETE" });

export const reportGroupMessage = (
  id: string,
  messageId: string,
  reason: string,
) =>
  request(`${messagePath(id, messageId)}/reports`, {
    method: "POST",
    body: json({ reason }),
  });

/** Profiles for these users, to show as message senders. */
export async function fetchMessageUsers(ids: string[]): Promise<MessageUser[]> {
  if (!ids.length) return [];
  const data: unknown = await request(
    `/v2/users/batch?ids=${ids.map(encodeURIComponent).join(",")}`,
  );
  return Array.isArray(data)
    ? data.flatMap((raw) => {
        const user = toMessageUser(raw);
        return user ? [user] : [];
      })
    : [];
}

/**
 * The group's generated icon (a collage of its most active members), fetched
 * with the same auth as other API calls; an <img src> would only send cookies.
 * `version` changes with membership, so a new collage isn't hidden by cache.
 */
export async function fetchGroupIcon(
  id: string,
  version: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const { url, headers } = buildApiFetchRequest(
    process.env.NEXT_PUBLIC_API_URL,
    `${groupPath(id)}/icon?v=${encodeURIComponent(version)}`,
  );
  const response = await fetch(url, {
    headers,
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    throw new GroupChatError(
      response.status,
      undefined,
      `Group icon unavailable (${response.status})`,
    );
  }
  return response.blob();
}
