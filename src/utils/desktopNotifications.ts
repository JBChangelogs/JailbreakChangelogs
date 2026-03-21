import { safeGetJSON, safeSetJSON } from "@/utils/safeStorage";

export const DESKTOP_NOTIFICATIONS_STORAGE_KEY =
  "desktop_notifications_enabled";

export type DesktopNotificationPermission =
  | NotificationPermission
  | "unsupported";

export function isDesktopNotificationsSupported(): boolean {
  return typeof Notification !== "undefined";
}

export function getDesktopNotificationPermission(): DesktopNotificationPermission {
  if (!isDesktopNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<DesktopNotificationPermission> {
  if (!isDesktopNotificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function getDesktopNotificationsEnabled(): boolean {
  const value = safeGetJSON<boolean>(DESKTOP_NOTIFICATIONS_STORAGE_KEY, false);
  return value === true;
}

export function setDesktopNotificationsEnabled(enabled: boolean): void {
  safeSetJSON(DESKTOP_NOTIFICATIONS_STORAGE_KEY, enabled);
}

export function shouldShowDesktopNotification(options?: {
  allowWhenVisible?: boolean;
}): boolean {
  if (!getDesktopNotificationsEnabled()) return false;
  if (!isDesktopNotificationsSupported()) return false;
  if (Notification.permission !== "granted") return false;
  if (typeof document === "undefined") return false;
  if (options?.allowWhenVisible) return true;

  const isTabVisible = document.visibilityState === "visible";
  const isWindowFocused =
    typeof document.hasFocus === "function" ? document.hasFocus() : true;

  return !isTabVisible || !isWindowFocused;
}

export function showDesktopNotification(input: {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  allowWhenVisible?: boolean;
}): void {
  if (
    !shouldShowDesktopNotification({ allowWhenVisible: input.allowWhenVisible })
  )
    return;

  const { title, body, url, tag } = input;
  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: "/favicon.ico",
      data: url ? { url } : undefined,
    });

    if (url) {
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();
        window.open(url, "_blank", "noopener,noreferrer");
      };
    }
  } catch {
    // Ignore Notification construction errors (permissions, browser quirks, etc.)
  }
}
