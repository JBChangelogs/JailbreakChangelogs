import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

const PREFERENCE_KEY = "theme_competition_banner_enabled";
const CHANGE_EVENT = "themeCompetitionBannerChanged";
let enabled: boolean | undefined;

export function getThemeCompetitionBannerEnabled(): boolean {
  if (enabled === undefined) {
    const cached = getCachedPreference(PREFERENCE_KEY);
    enabled =
      typeof cached === "boolean"
        ? cached
        : safeLocalStorage.getItem(PREFERENCE_KEY) !== "false";
  }
  return enabled;
}

function applyEnabled(value: unknown) {
  if (value !== undefined && typeof value !== "boolean") return;
  enabled = value ?? true;
  safeLocalStorage.setItem(PREFERENCE_KEY, String(enabled));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setThemeCompetitionBannerEnabled(value: boolean) {
  applyEnabled(value);
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: { key: PREFERENCE_KEY, value },
    }),
  );
}

export function subscribeThemeCompetitionBanner(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function syncThemeCompetitionBannerPreferences() {
  const onSet = (event: Event) => {
    const { key, value } = (
      event as CustomEvent<{ key: string; value?: unknown }>
    ).detail;
    if (key === PREFERENCE_KEY) applyEnabled(value);
  };
  const onSnapshot = (event: Event) => {
    applyEnabled(
      (event as CustomEvent<Record<string, unknown>>).detail[PREFERENCE_KEY],
    );
  };
  const onDelete = (event: Event) => {
    if ((event as CustomEvent<{ key: string }>).detail.key === PREFERENCE_KEY)
      applyEnabled(true);
  };
  window.addEventListener("realtimePreference", onSet);
  window.addEventListener("realtimePreferences", onSnapshot);
  window.addEventListener("realtimePreferenceDeleted", onDelete);
  if (hasSyncedPreferences()) applyEnabled(getCachedPreference(PREFERENCE_KEY));
  return () => {
    window.removeEventListener("realtimePreference", onSet);
    window.removeEventListener("realtimePreferences", onSnapshot);
    window.removeEventListener("realtimePreferenceDeleted", onDelete);
  };
}
