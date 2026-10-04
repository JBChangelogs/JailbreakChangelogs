import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

export type DesktopNavigation = "sidebar" | "top-bar";
export const DESKTOP_NAVIGATION_KEY = "desktop-navigation";

// Set the layout before first paint; the server still renders both menus.
export const DESKTOP_NAVIGATION_INIT_SCRIPT = `(function(){var n='sidebar';try{if(localStorage.getItem('${DESKTOP_NAVIGATION_KEY}')==='top-bar')n='top-bar';}catch(e){}document.documentElement.setAttribute('data-desktop-navigation',n);})();`;

export function getDesktopNavigation(): DesktopNavigation {
  return typeof document !== "undefined" &&
    document.documentElement.dataset.desktopNavigation === "top-bar"
    ? "top-bar"
    : "sidebar";
}

function applyDesktopNavigation(mode: DesktopNavigation) {
  document.documentElement.dataset.desktopNavigation = mode;
  safeLocalStorage.setItem(DESKTOP_NAVIGATION_KEY, mode);
  window.dispatchEvent(new Event("desktopNavigationChanged"));
}

export function setDesktopNavigation(mode: DesktopNavigation) {
  applyDesktopNavigation(mode);
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: { key: "desktop_navigation", value: mode },
    }),
  );
}

export function subscribeDesktopNavigation(onChange: () => void) {
  window.addEventListener("desktopNavigationChanged", onChange);
  return () => window.removeEventListener("desktopNavigationChanged", onChange);
}

export function syncDesktopNavigationPreferences() {
  const apply = (value: unknown) => {
    applyDesktopNavigation(value === "top-bar" ? "top-bar" : "sidebar");
  };
  const handlePreference = (event: Event) => {
    const { key, value } = (
      event as CustomEvent<{ key: string; value: unknown }>
    ).detail;
    if (key === "desktop_navigation") apply(value);
  };
  const handlePreferences = (event: Event) => {
    apply(
      (event as CustomEvent<Record<string, unknown>>).detail.desktop_navigation,
    );
  };
  const handleDeleted = (event: Event) => {
    if (
      (event as CustomEvent<{ key: string }>).detail.key ===
      "desktop_navigation"
    ) {
      apply("sidebar");
    }
  };
  window.addEventListener("realtimePreference", handlePreference);
  window.addEventListener("realtimePreferences", handlePreferences);
  window.addEventListener("realtimePreferenceDeleted", handleDeleted);
  if (hasSyncedPreferences()) apply(getCachedPreference("desktop_navigation"));
  return () => {
    window.removeEventListener("realtimePreference", handlePreference);
    window.removeEventListener("realtimePreferences", handlePreferences);
    window.removeEventListener("realtimePreferenceDeleted", handleDeleted);
  };
}
