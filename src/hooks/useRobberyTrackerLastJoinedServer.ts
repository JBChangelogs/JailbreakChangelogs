"use client";

import { useCallback, useEffect, useState } from "react";
import { safeSessionStorage } from "@/utils/safeStorage";

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

function writeLastJoined(value: RobberyTrackerLastJoinedTarget | null) {
  safeSetSessionJSON(ROBBERY_TRACKER_LAST_JOINED_STORAGE_KEY, value);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ROBBERY_TRACKER_LAST_JOINED_EVENT_NAME, {
        detail: value,
      }),
    );
  }
}

export function useRobberyTrackerLastJoinedServer() {
  const [lastJoined, setLastJoinedState] =
    useState<RobberyTrackerLastJoinedTarget | null>(readLastJoined);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ROBBERY_TRACKER_LAST_JOINED_STORAGE_KEY) return;
      setLastJoinedState(readLastJoined());
    };

    const handleCustomEvent = (event: Event) => {
      const custom =
        event as CustomEvent<RobberyTrackerLastJoinedTarget | null>;
      setLastJoinedState(custom.detail ?? null);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      ROBBERY_TRACKER_LAST_JOINED_EVENT_NAME,
      handleCustomEvent,
    );
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        ROBBERY_TRACKER_LAST_JOINED_EVENT_NAME,
        handleCustomEvent,
      );
    };
  }, []);

  const setLastJoined = useCallback((value: RobberyTrackerLastJoinedTarget) => {
    setLastJoinedState(value);
    writeLastJoined(value);
  }, []);

  const clearLastJoined = useCallback(() => {
    setLastJoinedState(null);
    writeLastJoined(null);
  }, []);

  return { lastJoined, setLastJoined, clearLastJoined };
}
