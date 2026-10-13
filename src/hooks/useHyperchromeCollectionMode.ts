"use client";

import { useSyncExternalStore } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

const STORAGE_KEY = "hyperchromeCollectionMode";
const subscribers = new Set<() => void>();
let countLowerLevels: boolean | undefined;

function getSnapshot() {
  return (countLowerLevels ??=
    safeLocalStorage.getItem(STORAGE_KEY) !== "every-level");
}

function subscribe(onChange: () => void) {
  subscribers.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    countLowerLevels = undefined;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setCountLowerLevels(value: boolean) {
  countLowerLevels = value;
  safeLocalStorage.setItem(STORAGE_KEY, value ? "lower-levels" : "every-level");
  subscribers.forEach((onChange) => onChange());
}

export function useHyperchromeCollectionMode() {
  return {
    countLowerLevels: useSyncExternalStore(subscribe, getSnapshot, () => true),
    setCountLowerLevels,
  };
}
