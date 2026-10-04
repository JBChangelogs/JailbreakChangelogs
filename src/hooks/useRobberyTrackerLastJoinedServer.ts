"use client";

import { useCallback, useSyncExternalStore } from "react";
import { safeSessionStorage } from "@/utils/storage/safeStorage";

const ROBBERY_TRACKER_LAST_JOINED_STORAGE_KEY =
  "robberyTrackerLastJoinedTarget";
const ROBBERY_TRACKER_LAST_JOINED_EVENT_NAME = "robberyTracker:lastJoined";

type Tracker = "robberies" | "mansions" | "airdrops" | "grouped" | "bounties";

export type RobberyTrackerLastJoinedTarget =
  | {
      kind: "robbery";
      jobId: string;
      markerName: string;
      joinedAt: number; // unix seconds
      label?: string;
      tracker?: Tracker;
    }
  | {
      kind: "airdrop";
      jobId: string;
      location: string;
      color: string;
      joinedAt: number; // unix seconds
      label?: string;
      tracker?: Tracker;
    }
  | {
      kind: "grouped";
      jobId: string;
      joinedAt: number; // unix seconds
      label?: string;
      tracker?: Tracker;
    }
  | {
      kind: "combo";
      jobId: string;
      comboId: string;
      joinedAt: number; // unix seconds
      label?: string;
      tracker?: Tracker;
    }
  | {
      kind: "bounty";
      jobId: string;
      joinedAt: number; // unix seconds
      label?: string;
      tracker?: Tracker;
    };

function isValidLastJoined(
  value: unknown,
): value is RobberyTrackerLastJoinedTarget {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.jobId !== "string" || record.jobId.length === 0)
    return false;
  if (typeof record.joinedAt !== "number" || !Number.isFinite(record.joinedAt))
    return false;
  if (typeof record.kind !== "string") return false;

  switch (record.kind) {
    case "robbery":
      return (
        typeof record.markerName === "string" && record.markerName.length > 0
      );
    case "airdrop":
      return (
        typeof record.location === "string" &&
        record.location.length > 0 &&
        typeof record.color === "string" &&
        record.color.length > 0
      );
    case "grouped":
    case "bounty":
      return true;
    case "combo":
      return typeof record.comboId === "string" && record.comboId.length > 0;
    default:
      return false;
  }
}

function safeGetSessionJSON<T>(key: string, defaultValue: T): T {
  const raw = safeSessionStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function safeSetSessionJSON(key: string, value: unknown) {
  try {
    safeSessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function readLastJoined(): RobberyTrackerLastJoinedTarget | null {
  const stored = safeGetSessionJSON<unknown>(
    ROBBERY_TRACKER_LAST_JOINED_STORAGE_KEY,
    null,
  );
  return isValidLastJoined(stored) ? stored : null;
}

const listeners = new Set<() => void>();
let snapshot: RobberyTrackerLastJoinedTarget | null = null;
let initialized = false;

function getLastJoined() {
  if (!initialized) {
    snapshot = readLastJoined();
    initialized = true;
  }
  return snapshot;
}

function publish(value: RobberyTrackerLastJoinedTarget | null) {
  initialized = true;
  if (snapshot === value) return;
  snapshot = value;
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent) {
  if (
    event.key === null ||
    event.key === ROBBERY_TRACKER_LAST_JOINED_STORAGE_KEY
  ) {
    publish(readLastJoined());
  }
}

function handleCustomEvent(event: Event) {
  const value = (event as CustomEvent<unknown>).detail;
  if (value === null || isValidLastJoined(value)) publish(value);
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      ROBBERY_TRACKER_LAST_JOINED_EVENT_NAME,
      handleCustomEvent,
    );
    // Catch a storage change between the first render and subscription.
    snapshot = readLastJoined();
    initialized = true;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        ROBBERY_TRACKER_LAST_JOINED_EVENT_NAME,
        handleCustomEvent,
      );
      initialized = false;
    }
  };
}

function writeLastJoined(value: RobberyTrackerLastJoinedTarget | null) {
  safeSetSessionJSON(ROBBERY_TRACKER_LAST_JOINED_STORAGE_KEY, value);
  publish(value);
  window.dispatchEvent(
    new CustomEvent(ROBBERY_TRACKER_LAST_JOINED_EVENT_NAME, { detail: value }),
  );
}

const clearLastJoined = () => writeLastJoined(null);
const getServerSnapshot = () => null;

export function useRobberyTrackerLastJoinedServer(serverId?: string) {
  const getSnapshot = useCallback(() => {
    const target = getLastJoined();
    return serverId === undefined || target?.jobId === serverId ? target : null;
  }, [serverId]);
  const lastJoined = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return { lastJoined, setLastJoined: writeLastJoined, clearLastJoined };
}
