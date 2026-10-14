import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

export type TabStyle = "underline" | "filled";
const PREFERENCE_KEY = "tab_style";

export const TAB_STYLE_INIT_SCRIPT = `(function(){var s='underline';try{if(localStorage.getItem('${PREFERENCE_KEY}')==='filled')s='filled';}catch(e){}document.documentElement.setAttribute('data-tab-style',s);})();`;

export function getTabStyle(): TabStyle {
  return typeof document !== "undefined" &&
    document.documentElement.dataset.tabStyle === "filled"
    ? "filled"
    : "underline";
}

function applyTabStyle(style: TabStyle) {
  document.documentElement.dataset.tabStyle = style;
  safeLocalStorage.setItem(PREFERENCE_KEY, style);
  window.dispatchEvent(new Event("tabStyleChanged"));
}

export function setTabStyle(style: TabStyle) {
  applyTabStyle(style);
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: { key: PREFERENCE_KEY, value: style },
    }),
  );
}

export function subscribeTabStyle(onChange: () => void) {
  window.addEventListener("tabStyleChanged", onChange);
  return () => window.removeEventListener("tabStyleChanged", onChange);
}

export function syncTabStylePreferences() {
  const apply = (value: unknown) => {
    if (value === undefined || value === "underline" || value === "filled") {
      applyTabStyle(value ?? "underline");
    }
  };
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
      apply("underline");
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
