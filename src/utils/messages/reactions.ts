import { toast } from "sonner";
import { recordEmojiUse } from "@/hooks/useFrequentEmojis";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { getResponseErrorMessage } from "@/utils/api/api";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";
import { parseReactions } from "@/utils/messages/parsing";
import type { Message, MessageReactions } from "@/utils/messages/types";

/** Adds or removes the user's reaction, dropping an emoji nobody uses. */
export function toggleReaction(
  reactions: MessageReactions | undefined,
  emoji: string,
  userId: string,
): MessageReactions {
  const users = reactions?.[emoji] ?? [];
  const next = { ...reactions };
  const remaining = users.includes(userId)
    ? users.filter((id) => id !== userId)
    : [...users, userId];
  if (remaining.length) next[emoji] = remaining;
  else delete next[emoji];
  return next;
}

/**
 * Toggles a reaction on the server (the first call adds, a repeat removes)
 * and returns the message's reactions. `path` is the message's API path.
 */
export async function sendReactionToggle(
  path: string,
  emoji: string,
): Promise<MessageReactions | null> {
  const { url, headers } = buildApiFetchRequest(
    process.env.NEXT_PUBLIC_API_URL,
    `${path}/reactions?emoji=${encodeURIComponent(emoji)}`,
  );
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
  });
  if (!response.ok)
    throw new Error(
      await getResponseErrorMessage(response, "Failed to react to message"),
    );
  let body: Record<string, unknown> = {};
  try {
    // Snowflake user ids past 2^53 would lose digits as JS numbers.
    body = (parseJsonWithLargeIds(await response.text()) ?? {}) as Record<
      string,
      unknown
    >;
  } catch {
    // An unreadable body: the caller keeps its optimistic state.
  }
  const message = body.message as Record<string, unknown> | undefined;
  // {} is a real answer (the last reaction went); a missing field isn't.
  const raw = body.reactions ?? message?.reactions;
  return raw == null ? null : parseReactions(raw);
}

/** The latest toggle per message, so quick repeats build on each other. */
const reactionQueues = new Map<string, Promise<MessageReactions>>();

/**
 * Toggles your reaction at once, then takes the server's reactions; rolls
 * back if the request fails.
 */
export async function reactToMessage({
  message,
  emoji,
  userId,
  path,
  setReactions,
}: {
  message: Message;
  emoji: string;
  userId: string;
  path: string;
  setReactions: (reactions: MessageReactions) => void;
}) {
  const operation = (
    reactionQueues.get(path) ?? Promise.resolve(message.reactions ?? {})
  ).then(async (previous) => {
    // Only adding counts toward your most-used emoji.
    if (!previous[emoji]?.includes(userId)) recordEmojiUse(emoji);
    const optimistic = toggleReaction(previous, emoji, userId);
    setReactions(optimistic);
    try {
      const confirmed = (await sendReactionToggle(path, emoji)) ?? optimistic;
      setReactions(confirmed);
      return confirmed;
    } catch (error) {
      setReactions(previous);
      toast.error(
        error instanceof Error ? error.message : "Failed to react to message",
      );
      return previous;
    }
  });
  reactionQueues.set(path, operation);
  await operation;
  if (reactionQueues.get(path) === operation) reactionQueues.delete(path);
}
