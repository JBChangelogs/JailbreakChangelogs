import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { SHARE_CODE } from "@/utils/ui/customTheme";

// Shared themes someone used, newest first, so they can switch back without
// the link. Only codes are kept; the themes load from their share codes.
// Synced as one comma-separated string, like "K7QM4XRP,ABCD2345".
const PREFERENCE_KEY = "recent_custom_themes";
const CHANGED_EVENT = "recentThemesChanged";
export const RECENT_THEMES_LIMIT = 5;

const EMPTY: string[] = [];
let recent: string[] | null = null;

export function parseRecentThemes(value: unknown): string[] {
  if (typeof value !== "string") return EMPTY;
  const codes = [...new Set(value.split(","))].filter((code) =>
    SHARE_CODE.test(code),
  );
  return codes.length ? codes.slice(0, RECENT_THEMES_LIMIT) : EMPTY;
}

/** Stable between changes, for useSyncExternalStore. */
export function getRecentThemes(): string[] {
  recent ??= parseRecentThemes(safeLocalStorage.getItem(PREFERENCE_KEY));
  return recent;
}

function applyRecentThemes(codes: string[]) {
  recent = codes.length ? codes : EMPTY;
  if (codes.length) safeLocalStorage.setItem(PREFERENCE_KEY, codes.join(","));
  else safeLocalStorage.removeItem(PREFERENCE_KEY);
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function saveRecentThemes(codes: string[]) {
  applyRecentThemes(codes);
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: codes.length
        ? { key: PREFERENCE_KEY, value: codes.join(",") }
        : { key: PREFERENCE_KEY, delete: true },
    }),
  );
}

/** Moves a shared theme to the front, dropping the oldest past the limit. */
export function rememberSharedTheme(code: string) {
  const current = getRecentThemes();
  if (current[0] === code) return;
  saveRecentThemes(
    [code, ...current.filter((c) => c !== code)].slice(0, RECENT_THEMES_LIMIT),
  );
}

export function forgetSharedTheme(code: string) {
  const current = getRecentThemes();
  if (current.includes(code)) {
    saveRecentThemes(current.filter((c) => c !== code));
  }
}

export function subscribeRecentThemes(onChange: () => void) {
  window.addEventListener(CHANGED_EVENT, onChange);
  return () => window.removeEventListener(CHANGED_EVENT, onChange);
}

export function syncRecentThemesPreferences() {
  const apply = (value: unknown) => applyRecentThemes(parseRecentThemes(value));
  const handlePreference = (event: Event) => {
    const { key, value } = (
      event as CustomEvent<{ key: string; value?: unknown }>
    ).detail;
    if (key === PREFERENCE_KEY) apply(value);
  };
  const handlePreferences = (event: Event) => {
    apply(
      (event as CustomEvent<Record<string, unknown>>).detail[PREFERENCE_KEY],
    );
  };
  const handleDeleted = (event: Event) => {
    if ((event as CustomEvent<{ key: string }>).detail.key === PREFERENCE_KEY) {
      apply(undefined);
    }
  };
  window.addEventListener("realtimePreference", handlePreference);
  window.addEventListener("realtimePreferences", handlePreferences);
  window.addEventListener("realtimePreferenceDeleted", handleDeleted);
  if (hasSyncedPreferences()) apply(getCachedPreference(PREFERENCE_KEY));
  return () => {
    window.removeEventListener("realtimePreference", handlePreference);
    window.removeEventListener("realtimePreferences", handlePreferences);
    window.removeEventListener("realtimePreferenceDeleted", handleDeleted);
  };
}
