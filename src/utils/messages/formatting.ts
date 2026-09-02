import { decode as decodeHtmlEntities } from "he";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { asId } from "@/utils/messages/parsing";
import type { Message, MessageUser, OfferItem } from "@/utils/messages/types";

export function getDisplayName(user: MessageUser): string {
  return user.global_name && user.global_name !== "None"
    ? user.global_name
    : user.username;
}

export function formatCountCapped(value: number, max = 99): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return value > max ? `${max}+` : String(Math.floor(value));
}

export function compactRelativeLabel(value: string): string {
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

export function formatSystemMessageContent(
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

export function formatOfferItemSummary(
  items: OfferItem[],
  maxItems = 2,
): string {
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

export function getDayKey(timestamp?: number): string | null {
  if (typeof timestamp !== "number") return null;
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function hasAvatarSettingsData(
  user: MessageUser | null | undefined,
): boolean {
  if (!user) return false;
  return typeof user.settings_v2?.custom_avatar === "boolean";
}

export function formatMessageText(value: string): string {
  return sanitizeText(decodeHtmlEntities(value));
}
