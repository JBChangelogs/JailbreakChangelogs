import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

export type DesktopNavigation = "sidebar" | "top-bar";
export const DESKTOP_NAVIGATION_KEY = "desktop-navigation";
export const DESKTOP_SIDEBAR_COLLAPSED_KEY = "desktop-sidebar-collapsed";

// Set the layout before first paint; the server still renders both menus.
export const DESKTOP_NAVIGATION_INIT_SCRIPT = `(function(){var n='sidebar',c=false;try{if(localStorage.getItem('${DESKTOP_NAVIGATION_KEY}')==='top-bar')n='top-bar';c=localStorage.getItem('${DESKTOP_SIDEBAR_COLLAPSED_KEY}')==='true';}catch(e){}document.documentElement.setAttribute('data-desktop-navigation',n);document.documentElement.setAttribute('data-desktop-sidebar-collapsed',String(c));})();`;

export function getDesktopSidebarCollapsed(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.dataset.desktopSidebarCollapsed === "true"
  );
}

function applyDesktopSidebarCollapsed(collapsed: boolean) {
  document.documentElement.dataset.desktopSidebarCollapsed = String(collapsed);
  safeLocalStorage.setItem(DESKTOP_SIDEBAR_COLLAPSED_KEY, String(collapsed));
  window.dispatchEvent(new Event("desktopNavigationChanged"));
}

let sidebarPreferenceTimeout: number | undefined;

export function setDesktopSidebarCollapsed(collapsed: boolean) {
  applyDesktopSidebarCollapsed(collapsed);
  window.clearTimeout(sidebarPreferenceTimeout);
  sidebarPreferenceTimeout = window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: "desktop_sidebar_collapsed", value: collapsed },
      }),
    );
  }, 300);
}

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
  // Slide the new navigation in for switches the user makes (see the
  // nav-layout-entering rules in globals.css); synced changes apply instantly.
  const root = document.documentElement;
  const reduceMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? true;
  if (!reduceMotion) {
    root.classList.add("nav-layout-entering");
    window.setTimeout(() => root.classList.remove("nav-layout-entering"), 400);
  }
  applyDesktopNavigation(mode);
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: { key: "desktop_navigation", value: mode },
    }),
  );
}

const LAYOUT_SHORTCUT_HIDDEN_KEY = "navigation-layout-shortcut-hidden";

/** Whether the header's "Change navigation layout" button is turned off. */
export function getLayoutShortcutHidden(): boolean {
  return safeLocalStorage.getItem(LAYOUT_SHORTCUT_HIDDEN_KEY) === "true";
}

export function setLayoutShortcutHidden(hidden: boolean) {
  safeLocalStorage.setItem(LAYOUT_SHORTCUT_HIDDEN_KEY, String(hidden));
  window.dispatchEvent(new Event("desktopNavigationChanged"));
}

/** Fires for layout, sidebar collapse, and the header-button setting. */
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
    if (key === "desktop_sidebar_collapsed")
      applyDesktopSidebarCollapsed(value === true);
  };
  const handlePreferences = (event: Event) => {
    const preferences = (event as CustomEvent<Record<string, unknown>>).detail;
    apply(preferences.desktop_navigation);
    applyDesktopSidebarCollapsed(
      preferences.desktop_sidebar_collapsed === true,
    );
  };
  const handleDeleted = (event: Event) => {
    if (
      (event as CustomEvent<{ key: string }>).detail.key ===
      "desktop_sidebar_collapsed"
    ) {
      applyDesktopSidebarCollapsed(false);
    }
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
  if (hasSyncedPreferences()) {
    apply(getCachedPreference("desktop_navigation"));
    applyDesktopSidebarCollapsed(
      getCachedPreference("desktop_sidebar_collapsed") === true,
    );
  }
  return () => {
    window.removeEventListener("realtimePreference", handlePreference);
    window.removeEventListener("realtimePreferences", handlePreferences);
    window.removeEventListener("realtimePreferenceDeleted", handleDeleted);
  };
}
