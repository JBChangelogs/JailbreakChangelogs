import { safeLocalStorage } from "@/utils/storage/safeStorage";

export function getThemeCursorEnabled(): boolean {
  return (
    typeof document === "undefined" ||
    document.documentElement.dataset.themeCursor !== "off"
  );
}

export function setThemeCursorEnabled(enabled: boolean) {
  document.documentElement.dataset.themeCursor = enabled ? "on" : "off";
  safeLocalStorage.setItem("theme-cursor-enabled", String(enabled));
  window.dispatchEvent(new Event("themeCursorChanged"));
}

export function subscribeThemeCursor(onChange: () => void) {
  window.addEventListener("themeCursorChanged", onChange);
  return () => window.removeEventListener("themeCursorChanged", onChange);
}
