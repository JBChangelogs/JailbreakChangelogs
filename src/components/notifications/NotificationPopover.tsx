"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/Pagination";
import {
  fetchNotificationHistory,
  fetchUnreadNotifications,
  clearNotificationHistory,
  NotificationHistory,
} from "@/utils/api/api";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import {
  getNotificationActionLabel,
  parseNotificationUrl,
} from "@/utils/notifications/notificationUrl";
import { NotifDescription } from "@/components/notifications/NotifDescription";
import { TwemojiText } from "@/components/ui/TwemojiText";
import { cn } from "@/lib/utils";

interface NotificationPopoverProps {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  isAuthenticated: boolean;
  variant: "mobile" | "desktop";
  onOpenChange?: (open: boolean) => void;
}

const UnreadBadge = ({
  count,
  variant,
}: {
  count: number;
  variant: "mobile" | "desktop";
}) => {
  if (count === 0) return null;
  const displayCount = count > 99 ? "99+" : count.toString();
  if (variant === "mobile") {
    const wide = count > 9;
    return (
      <span
        className={cn(
          "absolute top-0 right-0 z-10 flex translate-x-1/4 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white",
          wide ? "h-4 min-w-4 px-1" : "h-4 w-4",
        )}
      >
        {displayCount}
      </span>
    );
  }
  return (
    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
      {displayCount}
    </span>
  );
};

const NotifTimestamp = ({
  timestamp,
  notificationId,
}: {
  timestamp: string | number;
  notificationId: number;
}) => {
  const ts = typeof timestamp === "string" ? timestamp : timestamp.toString();
  const tsNum =
    typeof timestamp === "number" ? timestamp : Number.parseInt(timestamp, 10);
  const relativeTime = useOptimizedRealTimeRelativeDate(
    ts,
    `notif-${notificationId}`,
  );
  return (
    <p className="text-secondary-text mt-1 text-right text-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{relativeTime}</span>
        </TooltipTrigger>
        <TooltipContent>
          {Number.isFinite(tsNum) ? formatCustomDate(tsNum) : ts}
        </TooltipContent>
      </Tooltip>
    </p>
  );
};

export function NotificationPopover({
  unreadCount,
  setUnreadCount,
  isAuthenticated,
  variant,
  onOpenChange,
}: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"history" | "unread">("unread");
  const [notifications, setNotifications] =
    useState<NotificationHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnread = (p: number, limit: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      let data = await fetchUnreadNotifications(p, limit);
      if (data.items.length === 0 && p > 1) {
        const prev = p - 1;
        setPage(prev);
        data = await fetchUnreadNotifications(prev, limit);
      }
      setNotifications(data);
      const nextUnread =
        typeof data.unread_count === "number"
          ? data.unread_count
          : Math.max(0, data.total || 0);
      setUnreadCount(Math.max(0, nextUnread));
      setIsLoading(false);
    }, 300);
  };

  const fetchHistory = (p: number, limit: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      const data = await fetchNotificationHistory(p, limit);
      setNotifications(data);
      setIsLoading(false);
    }, 300);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (nextOpen && isAuthenticated) {
      setTab("unread");
      setPage(1);
      setIsLoading(true);
      setNotifications(null);
      fetchUnread(1, 5);
    } else if (!nextOpen) {
      setNotifications(null);
      setIsLoading(false);
    }
  };

  const isDesktop = variant === "desktop";

  const triggerButton = (
    <button
      suppressHydrationWarning={true}
      className={cn(
        "border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text relative flex cursor-pointer items-center justify-center rounded-lg border transition-all duration-200",
        isDesktop ? "h-10 w-10" : "h-8 w-8 hover:scale-105 active:scale-95",
      )}
      aria-label="Notifications"
    >
      <Icon
        icon="mingcute:notification-line"
        className={cn("text-primary-text", isDesktop ? "h-5 w-5" : "h-4 w-4")}
        inline={true}
      />
      {isAuthenticated && unreadCount > 0 && (
        <UnreadBadge count={unreadCount} variant={variant} />
      )}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {isDesktop ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      )}

      <PopoverContent
        align={isDesktop ? "end" : "center"}
        className={cn(
          "overflow-hidden rounded-2xl p-0",
          isDesktop ? "w-80" : "w-[calc(100vw-1rem)] max-w-md",
        )}
      >
        {/* Header */}
        <div className="border-border-secondary border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-primary-text font-semibold">
              {notifications
                ? `${notifications.total} ${tab === "unread" ? "Unread " : ""}Notification${notifications.total !== 1 ? "s" : ""}`
                : `0 ${tab === "unread" ? "Unread " : ""}Notifications`}
            </h3>
            {tab === "history" && notifications && notifications.total > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={async () => {
                      const success = await clearNotificationHistory();
                      if (success) {
                        toast.success("Cleared notification history", {
                          duration: 2000,
                        });
                        setIsLoading(true);
                        const data = await fetchNotificationHistory(1, 5);
                        setNotifications(data);
                        setPage(1);
                        setIsLoading(false);
                      } else {
                        toast.error("Failed to clear notification history", {
                          duration: 3000,
                        });
                      }
                    }}
                    data-rybbit-event="Clear Notification History"
                    className="text-secondary-text cursor-pointer transition-colors hover:text-red-500"
                  >
                    <Icon
                      icon="si:bin-fill"
                      className="h-5 w-5"
                      inline={true}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Clear History</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Tabs */}
        {isAuthenticated && (
          <div className="border-border-secondary border-b">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                if (value !== "unread" && value !== "history") return;
                setTab(value);
                setPage(1);
                setIsLoading(true);
                setNotifications(null);
                if (value === "unread") fetchUnread(1, 5);
                else fetchHistory(1, 5);
              }}
            >
              <TabsList className="w-full rounded-none border-0 p-0" fullWidth>
                <TabsTrigger
                  value="unread"
                  fullWidth
                  className="rounded-none data-[state=active]:shadow-none"
                >
                  Unread
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  fullWidth
                  className="rounded-none data-[state=active]:shadow-none"
                >
                  History
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Settings link */}
        {isAuthenticated && (
          <div className="border-border-secondary bg-secondary-bg/30 border-b px-4 py-2">
            <p className="text-secondary-text text-xs">
              Manage which notifications you receive in{" "}
              <Link
                href="/settings?highlight=notifications"
                className="text-link hover:underline"
                onClick={() => handleOpenChange(false)}
              >
                Settings
              </Link>
            </p>
          </div>
        )}

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex min-h-50 flex-col items-center justify-center px-4 py-8">
              <Spinner className="h-8 w-8" />
              <p className="text-secondary-text mt-3 text-center text-sm">
                Loading notifications...
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center justify-center px-4 py-8">
              <p className="text-secondary-text text-center text-sm">
                You must be logged in to view notifications
              </p>
            </div>
          ) : notifications && notifications.items.length > 0 ? (
            <>
              <div className="py-2">
                {notifications.items.map((notif) => {
                  const urlInfo = parseNotificationUrl(notif.link);
                  const actionLabel = getNotificationActionLabel(urlInfo);
                  const shouldHideViewAction =
                    notif.title.trim().toLowerCase() === "login detected";

                  return (
                    <div
                      key={notif.id}
                      className="border-border-secondary hover:bg-secondary-bg block border-b px-4 py-3 transition-colors last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <TwemojiText
                          tag="p"
                          className="text-primary-text flex-1 text-sm font-semibold wrap-break-word whitespace-normal"
                        >
                          {notif.title}
                        </TwemojiText>
                      </div>
                      <div className="text-secondary-text mt-1 text-xs wrap-break-word">
                        <NotifDescription
                          text={notif.description}
                          className="text-secondary-text text-xs leading-relaxed"
                        />
                      </div>
                      {shouldHideViewAction ? null : urlInfo.isWhitelisted ? (
                        urlInfo.isJailbreakChangelogs &&
                        urlInfo.relativePath ? (
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="mt-2"
                          >
                            <Link
                              href={urlInfo.relativePath}
                              prefetch={false}
                              onClick={() => handleOpenChange(false)}
                            >
                              {actionLabel}
                            </Link>
                          </Button>
                        ) : !urlInfo.isJailbreakChangelogs &&
                          urlInfo.validatedExternalHref ? (
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="mt-2"
                          >
                            <a
                              href={urlInfo.validatedExternalHref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {actionLabel}
                            </a>
                          </Button>
                        ) : null
                      ) : (
                        <p className="text-secondary-text mt-1 text-xs break-all">
                          {notif.link}
                        </p>
                      )}
                      <NotifTimestamp
                        timestamp={notif.last_updated}
                        notificationId={notif.id}
                      />
                    </div>
                  );
                })}
              </div>
              {notifications.total_pages > 1 && (
                <div className="border-border-secondary flex justify-center border-t py-3">
                  <Pagination
                    count={notifications.total_pages}
                    page={page}
                    siblingCount={0}
                    onChange={(_e, value) => {
                      setPage(value);
                      if (tab === "history") fetchHistory(value, 5);
                      else fetchUnread(value, 5);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-50 flex-col items-center justify-center px-4 py-8">
              <Icon
                icon="mingcute:notification-line"
                className="text-secondary-text mb-3 h-12 w-12"
                inline={true}
              />
              <p className="text-secondary-text text-center text-sm">
                No new notifications
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
