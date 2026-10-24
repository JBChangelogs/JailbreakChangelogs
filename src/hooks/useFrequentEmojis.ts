"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { EmojiStringMap } from "@/utils/comments/emojiShortcodes";

/** Same key and shape as the app: { emoji: count }. */
const STORAGE_KEY = "jbcl:emoji-usage";
const listeners = new Set<() => void>();
let snapshot: string | null = null;

function read(): string {
  if (snapshot === null) {
    try {
      snapshot = localStorage.getItem(STORAGE_KEY) ?? "{}";
    } catch {
      snapshot = "{}";
    }
  }
  return snapshot;
}

function usage(raw = read()): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

/** Counts an emoji you added as a reaction or picked in the composer. */
export function recordEmojiUse(emoji: string) {
  const counts = usage();
  counts[emoji] = (counts[emoji] ?? 0) + 1;
  snapshot = JSON.stringify(counts);
  try {
    localStorage.setItem(STORAGE_KEY, snapshot);
  } catch {
    // Still counted for this tab.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Your most-used allowed emoji, most first. Ties keep the API's order, so
 * with no usage these are its first entries (👍 👎 ❤️ 😂).
 */
export function useFrequentEmojis(emojiMap: EmojiStringMap, count: number) {
  const raw = useSyncExternalStore(subscribe, read, () => "{}");
  return useMemo(() => {
    const counts = usage(raw);
    // A stable sort, so ties stay in API order.
    return [...new Set(Object.values(emojiMap))]
      .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
      .slice(0, count);
  }, [emojiMap, count, raw]);
}
