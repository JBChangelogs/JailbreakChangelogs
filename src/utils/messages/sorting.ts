import type { ConversationSummary, Message } from "@/utils/messages/types";

export function getLatestMessage(messages: Message[]): Message | undefined {
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

export function sortConversationsByLatestMessage(
  conversations: ConversationSummary[],
): ConversationSummary[] {
  return [...conversations].sort(
    (a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
  );
}

export function createClientMessageId(): string {
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getMessageDomId(message: Message): string {
  return message.clientId ?? message.id;
}

export function sortMessagesByCreatedAt(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

export function trimLocalThreadMessages(
  messages: Message[],
  max = 200,
): Message[] {
  if (messages.length <= max) return messages;
  return messages.slice(messages.length - max);
}
