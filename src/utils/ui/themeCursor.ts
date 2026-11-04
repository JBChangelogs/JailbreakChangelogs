import { safeLocalStorage } from "@/utils/storage/safeStorage";
import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";

const PREFERENCE_KEY = "theme_cursor_enabled";

export function getThemeCursorEnabled(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.dataset.themeCursor === "on"
  );
}

function applyThemeCursorEnabled(enabled: boolean) {
  document.documentElement.dataset.themeCursor = enabled ? "on" : "off";
  safeLocalStorage.setItem("theme-cursor-enabled", String(enabled));
  window.dispatchEvent(new Event("themeCursorChanged"));
}

export function setThemeCursorEnabled(enabled: boolean) {
  applyThemeCursorEnabled(enabled);
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: { key: PREFERENCE_KEY, value: enabled },
    }),
  );
}

export function subscribeThemeCursor(onChange: () => void) {
  window.addEventListener("themeCursorChanged", onChange);
  return () => window.removeEventListener("themeCursorChanged", onChange);
}

export function syncThemeCursorPreferences() {
  const apply = (value: unknown) => {
    if (value === undefined || typeof value === "boolean")
      applyThemeCursorEnabled(value ?? false);
  };
  const onSet = (event: Event) => {
    const { key, value } = (
      event as CustomEvent<{ key: string; value?: unknown }>
    ).detail;
    if (key === PREFERENCE_KEY) apply(value);
  };
  const onSnapshot = (event: Event) => {
    apply(
      (event as CustomEvent<Record<string, unknown>>).detail[PREFERENCE_KEY],
    );
  };
  const onDelete = (event: Event) => {
    if ((event as CustomEvent<{ key: string }>).detail.key === PREFERENCE_KEY)
      apply(false);
  };
  window.addEventListener("realtimePreference", onSet);
  window.addEventListener("realtimePreferences", onSnapshot);
  window.addEventListener("realtimePreferenceDeleted", onDelete);
  if (hasSyncedPreferences()) apply(getCachedPreference(PREFERENCE_KEY));
  return () => {
    window.removeEventListener("realtimePreference", onSet);
    window.removeEventListener("realtimePreferences", onSnapshot);
    window.removeEventListener("realtimePreferenceDeleted", onDelete);
  };
}
