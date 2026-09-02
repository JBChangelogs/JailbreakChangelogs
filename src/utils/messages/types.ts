import type { UserFlag, UserSettingsV2 } from "@/types/auth";

export type MessageUser = {
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

export type Message = {
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

export type OfferAcceptedMetadata = {
  type: "offer_accepted";
  user?: string | number;
  offer?: number;
  trade?: number;
  trade_user?: string | number;
};

export type ConversationSummary = {
  user: MessageUser;
  lastMessage?: Message;
  messageCount?: number;
};

export const MESSAGE_CHAR_LIMIT = 350;

export type ApiSendResponse = {
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

export type ApiErrorResponse = {
  error?: string;
  reason?: string;
  detail?: string | { message?: string };
  message?: string;
  limit?: number;
};

export type RealtimeMessageEventDetail = {
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
export const WS_SEND_FALLBACK_MS = 1200;

export type OfferItem = { name: string; amount: number; type?: string };
