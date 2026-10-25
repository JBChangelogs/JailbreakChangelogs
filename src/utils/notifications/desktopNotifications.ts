import { safeGetJSON, safeSetJSON } from "@/utils/storage/safeStorage";

const DESKTOP_NOTIFICATIONS_STORAGE_KEY = "desktop_notifications_enabled";
const messageNotifications = new Map<Notification, string>();

export function dismissMessageDesktopNotifications(path?: string): void {
  const pathname = path?.split(/[?#]/, 1)[0].replace(/\/$/, "");
  for (const [notification, conversation] of messageNotifications) {
    if (pathname !== undefined && conversation !== pathname) continue;
    messageNotifications.delete(notification);
    notification.close();
  }
}

export type DesktopNotificationPermission =
  | NotificationPermission
  | "unsupported";

export type DesktopNotificationTarget =
  | {
      internalPath: string;
    }
  | {
      validatedExternalHref: string;
    };

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

export function isNotificationPageActive(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.visibilityState === "visible" &&
    (typeof document.hasFocus !== "function" || document.hasFocus())
  );
}

export function shouldShowDesktopNotification(options?: {
  allowWhenVisible?: boolean;
}): boolean {
  if (!getDesktopNotificationsEnabled()) return false;
  if (!isDesktopNotificationsSupported()) return false;
  if (Notification.permission !== "granted") return false;
  if (typeof document === "undefined") return false;
  if (options?.allowWhenVisible) return true;

  return !isNotificationPageActive();
}

export function showDesktopNotification(input: {
  title: string;
  body?: string;
  target?: DesktopNotificationTarget;
  tag?: string;
  allowWhenVisible?: boolean;
}): void {
  if (
    !shouldShowDesktopNotification({ allowWhenVisible: input.allowWhenVisible })
  )
    return;

  const { title, body, target, tag } = input;
  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: "/favicon.ico",
      data: target ?? undefined,
    });

    if (
      target &&
      "internalPath" in target &&
      (tag?.startsWith("realtime-dm:") || tag?.startsWith("realtime-group:"))
    ) {
      messageNotifications.set(notification, target.internalPath);
      notification.onclose = () => {
        messageNotifications.delete(notification);
      };
    }

    if (target) {
      notification.onclick = (event) => {
        event.preventDefault();
        messageNotifications.delete(notification);
        notification.close();
        if ("internalPath" in target) {
          dismissMessageDesktopNotifications(target.internalPath);
          window.location.assign(target.internalPath);
          return;
        }
        window.open(
          target.validatedExternalHref,
          "_blank",
          "noopener,noreferrer",
        );
      };
    }
  } catch {
    // Ignore Notification construction errors (permissions, browser quirks, etc.)
  }
}
