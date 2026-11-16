"use client";

import { useMemo, useSyncExternalStore } from "react";

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

export function useFrequentEmojis(defaults: string[], count: number) {
  const raw = useSyncExternalStore(subscribe, read, () => "{}");
  const key = defaults.join(" ");
  return useMemo(() => {
    const counts = usage(raw);
    const used = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return [...new Set([...used, ...key.split(" ").filter(Boolean)])].slice(
      0,
      count,
    );
  }, [key, count, raw]);
}
