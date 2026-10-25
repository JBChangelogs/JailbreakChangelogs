"use client";

import { FRONTEND_SETTINGS } from "@/config/settings";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { SettingRow } from "@/components/Settings/SettingRow";
import {
  getDesktopNotificationPermission,
  getDesktopNotificationsEnabled,
  isDesktopNotificationsSupported,
  requestDesktopNotificationPermission,
  setDesktopNotificationsEnabled,
} from "@/utils/notifications/desktopNotifications";

export function DesktopNotificationToggle() {
  const [enabled, setEnabled] = useState(getDesktopNotificationsEnabled);
  const [permission, setPermission] = useState(
    getDesktopNotificationPermission,
  );

  const disabledReason = useMemo(() => {
    if (!isDesktopNotificationsSupported())
      return "Not supported in this browser.";
    if (permission === "denied") return "Blocked in your browser settings.";
    return null;
  }, [permission]);

  const handleToggle = async (next: boolean) => {
    if (!isDesktopNotificationsSupported()) {
      toast.error("Desktop notifications are not supported in this browser.");
      return;
    }

    if (!next) {
      setEnabled(false);
      setDesktopNotificationsEnabled(false);
      return;
    }

    if (Notification.permission === "granted") {
      setEnabled(true);
      setDesktopNotificationsEnabled(true);
      return;
    }

    if (Notification.permission === "denied") {
      setPermission("denied");
      toast.error(
        "Desktop notifications are blocked in your browser settings.",
      );
      setEnabled(false);
      setDesktopNotificationsEnabled(false);
      return;
    }

    const result = await requestDesktopNotificationPermission();
    setPermission(result);

    if (result === "granted") {
      setEnabled(true);
      setDesktopNotificationsEnabled(true);
      toast.success("Desktop notifications enabled.");
      return;
    }

    setEnabled(false);
    setDesktopNotificationsEnabled(false);
    toast.error("Permission not granted.");
  };

  const description = disabledReason
    ? `Desktop notifications unavailable: ${disabledReason}`
    : FRONTEND_SETTINGS["desktop-notifications"].description!;

  return (
    <div className={`${disabledReason ? "opacity-75" : ""}`}>
      <SettingRow
        title={FRONTEND_SETTINGS["desktop-notifications"].title}
        highlight
        description={description}
        action={
          <Switch
            id="desktop-notifications-toggle"
            aria-label="Desktop notifications"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={!!disabledReason && !enabled}
          />
        }
      />
    </div>
  );
}
