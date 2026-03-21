"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  getDesktopNotificationPermission,
  getDesktopNotificationsEnabled,
  isDesktopNotificationsSupported,
  requestDesktopNotificationPermission,
  setDesktopNotificationsEnabled,
} from "@/utils/desktopNotifications";

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
    : "Show browser notifications when the browser tab is not in view.";

  return (
    <div className="mb-4 w-full">
      <div
        className={`mb-1 flex w-full items-center justify-between gap-4 ${
          disabledReason ? "cursor-not-allowed opacity-75" : ""
        }`}
      >
        <div className="flex min-w-0 flex-col">
          <label className="text-primary-text text-base font-medium">
            Desktop Notifications
          </label>
          <p className="text-secondary-text text-sm">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={!!disabledReason && !enabled}
          />
        </div>
      </div>
    </div>
  );
}
