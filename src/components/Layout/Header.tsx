"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Tooltip,
  Pagination,
} from "@mui/material";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import {
  logout,
  trackLogoutSource,
  showLogoutToast,
  showLogoutLoadingToast,
  dismissLogoutLoadingToast,
} from "@/utils/auth";
import toast from "react-hot-toast";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
import EscapeLoginModal from "../Auth/EscapeLoginModal";
import { useEscapeLogin } from "@/utils/escapeLogin";
import { UserAvatar } from "@/utils/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
// import { PUBLIC_API_URL } from '@/utils/api';
import { isFeatureEnabled } from "@/utils/featureFlags";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const AnimatedThemeToggler = dynamic(
  () =>
    import("@/components/ui/animated-theme-toggler").then((mod) => ({
      default: mod.AnimatedThemeToggler,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="border-border-primary bg-secondary-bg text-secondary-text hover:text-primary-text hover:bg-quaternary-bg flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95">
        <div className="h-5 w-5" />
      </div>
    ),
  },
);
import { NavbarModern } from "@/components/ui/navbar";
import ServiceAvailabilityTicker from "./ServiceAvailabilityTicker";
import NewsTicker from "./NewsTicker";

import { Icon } from "../ui/IconWrapper";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  fetchNotificationHistory,
  fetchUnreadNotifications,
  markNotificationAsSeen,
  clearUnreadNotifications,
  clearNotificationHistory,
  NotificationHistory,
} from "@/utils/api";
import { formatCompactDateTime } from "@/utils/timestamp";

const UnreadNotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();
  const isDoubleDigit = count > 9 && count <= 99;

  return (
    <span
      className={`absolute top-0 right-0 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white z-10 translate-x-1/4 -translate-y-1/2 ${
        isDoubleDigit || count > 99 ? "h-4 px-1 min-w-[16px]" : "h-4 w-4"
      }`}
    >
      {displayCount}
    </span>
  );
};

const NotificationTimestamp = ({
  timestamp,
}: {
  timestamp: string | number;
}) => {
  const timestampString =
    typeof timestamp === "string" ? timestamp : timestamp.toString();
  const timestampNumber =
    typeof timestamp === "number" ? timestamp : Number.parseInt(timestamp, 10);
  const hasValidNumber = Number.isFinite(timestampNumber);

  const absoluteTime = hasValidNumber
    ? formatCompactDateTime(timestampNumber)
    : timestampString;

  return (
    <p className="text-secondary-text text-xs mt-1 text-right">
      <span>{absoluteTime}</span>
    </p>
  );
};

export default function Header() {
  const pathname = usePathname();
  const isCollabPage =
    pathname === "/values" ||
    pathname.startsWith("/item") ||
    pathname.startsWith("/trading") ||
    pathname.startsWith("/values/changelogs");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"history" | "unread">(
    "unread",
  );
  const [notifications, setNotifications] =
    useState<NotificationHistory | null>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const [markedAsSeen, setMarkedAsSeen] = useState<Set<number>>(new Set());
  const [notificationTimeoutId, setNotificationTimeoutId] =
    useState<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Debounced notification fetching functions
  const fetchUnreadWithDebounce = (page: number, limit: number) => {
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingNotifications(true);
      const data = await fetchUnreadNotifications(page, limit);
      setNotifications(data);
      setIsLoadingNotifications(false);
    }, 300);

    setNotificationTimeoutId(timeoutId);
  };

  const fetchHistoryWithDebounce = (page: number, limit: number) => {
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingNotifications(true);
      const data = await fetchNotificationHistory(page, limit);
      setNotifications(data);
      setIsLoadingNotifications(false);
    }, 300);

    setNotificationTimeoutId(timeoutId);
  };

  const {
    showLoginModal,
    setShowLoginModal,
    user: authUser,
    isAuthenticated,
  } = useAuthContext();
  const { resolvedTheme } = useTheme();
  const userData = isAuthenticated ? authUser : null;
  useEscapeLogin();

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/notifications/unread", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [pathname, isAuthenticated, fetchUnreadCount]);

  const handleLogout = async () => {
    let loadingToast: string | undefined;

    try {
      // Show loading toast with deduplication
      loadingToast = showLogoutLoadingToast();

      trackLogoutSource("Header Component");
      await logout();

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      showLogoutToast();
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to log out. Please try again.", {
        duration: 3000,
        position: "bottom-right",
      });
    } finally {
      // Always dismiss the loading toast
      dismissLogoutLoadingToast(loadingToast);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div className="flex flex-col h-full">
      {userData ? (
        <>
          <Link
            href={`/users/${userData?.id}`}
            onClick={handleDrawerToggle}
            className="flex items-center gap-3 min-w-0 w-full pr-8 px-4 py-3 border-b border-border-secondary cursor-pointer hover:bg-button-info-hover/10 transition-colors"
          >
            <UserAvatar
              userId={userData.id}
              avatarHash={userData.avatar}
              username={userData.username}
              size={10}
              custom_avatar={userData.custom_avatar}
              showBadge={false}
              settings={userData.settings}
              premiumType={userData.premiumtype}
            />
            <div className="min-w-0 flex-1">
              <div className="text-primary-text font-semibold truncate max-w-[120px]">
                {userData.global_name || userData.username}
              </div>
              <div className="text-secondary-text text-sm">
                @{userData.username}
              </div>
            </div>
          </Link>
          {!userData.roblox_id && (
            <div
              onClick={() => {
                handleDrawerToggle();
                setShowLoginModal(true);
                const event = new CustomEvent("setLoginTab", { detail: 1 });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-button-info-hover/10 transition-colors"
            >
              <RobloxIcon className="h-5 w-5 text-primary-text" />
              <span className="text-primary-text">Connect Roblox</span>
            </div>
          )}
          <Link
            href="/settings"
            onClick={handleDrawerToggle}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-button-info-hover/10 transition-colors"
          >
            <Icon
              icon="material-symbols:settings"
              className="text-primary-text h-5 w-5"
              inline={true}
            />
            <span className="text-primary-text">Settings</span>
          </Link>
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-button-info-hover/10 transition-colors"
          >
            <Icon
              icon="material-symbols:logout"
              className="text-button-danger h-5 w-5"
              inline={true}
            />
            <span className="text-button-danger">Logout</span>
          </div>
        </>
      ) : (
        <div className="px-4 py-3">
          <button
            onClick={() => {
              setShowLoginModal(true);
              handleDrawerToggle();
            }}
            className="bg-button-info hover:bg-button-info-hover text-form-button-text cursor-pointer rounded-lg px-4 py-2 font-semibold transition-colors"
          >
            Login
          </button>
        </div>
      )}

      <div className="px-4 py-2">
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Game & Updates
        </Typography>
      </div>

      <Link
        href="/changelogs"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Changelogs
      </Link>
      <Link
        href="/seasons"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Browse Seasons
      </Link>
      <Link
        href="/seasons/leaderboard"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>Season Leaderboard</span>
        </Box>
      </Link>
      <Link
        href="/seasons/will-i-make-it"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>Will I Make It</span>
        </Box>
      </Link>
      <Link
        href="/seasons/contracts"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>Weekly Contracts</span>
        </Box>
      </Link>
      <div className="px-4 py-2">
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Calculators
        </Typography>
      </div>
      <Link
        href="/calculators"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        All Calculators
      </Link>
      <div className="px-4 py-2">
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Values
        </Typography>
      </div>
      <Link
        href="/values"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Value List
      </Link>
      <Link
        href="/values/changelogs"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Value Changelogs
      </Link>
      <Link
        href="/values/calculator"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Value Calculator
      </Link>
      <Link
        href="/dupes"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>Dupe Finder</span>
          {isFeatureEnabled("DUPE_FINDER") ? (
            <></>
          ) : (
            <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              Coming Soon
            </span>
          )}
        </Box>
      </Link>
      <Link
        href="/dupes/calculator"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Dupe Calculator
      </Link>
      <Link
        href="/trading"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Trade Ads
      </Link>
      <Link
        href="/inventories"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text group"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>Inventory Checker</span>
          {isFeatureEnabled("INVENTORY_CALCULATOR") ? (
            <></>
          ) : (
            <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              Coming Soon
            </span>
          )}
        </Box>
      </Link>
      <Link
        href="/og"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>OG Finder</span>
          {isFeatureEnabled("OG_FINDER") ? (
            <></>
          ) : (
            <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              Coming Soon
            </span>
          )}
        </Box>
      </Link>
      <div className="px-4 py-2">
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Community
        </Typography>
      </div>
      <Link
        href="/users"
        prefetch={false}
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        User Search
      </Link>
      <Link
        href="/leaderboard/money"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Money Leaderboard
      </Link>
      <Link
        href="/inventories/networth"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Networth Leaderboard
      </Link>
      <Link
        href="/servers"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Private Servers
      </Link>
      <Link
        href="/bot"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Discord Bot
      </Link>
      <Link
        href="/faq"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        FAQ
      </Link>
      <Link
        href="/contributors"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Meet the team
      </Link>
      <Link
        href="/testimonials"
        onClick={handleDrawerToggle}
        className="px-8 py-2 cursor-pointer hover:bg-button-info-hover/10 transition-colors text-primary-text"
      >
        Testimonials
      </Link>

      <div className="border-t border-border-primary my-4" />
    </div>
  );

  return (
    <>
      {/* Desktop navbar - hidden on mobile/tablet via CSS */}
      <div className="sticky top-0 z-[1300] hidden xl:block">
        <ServiceAvailabilityTicker />
        <NewsTicker />
        <div className="relative z-10">
          <NavbarModern />
        </div>
      </div>

      {/* Mobile header - hidden on desktop via CSS */}
      <div className="sticky top-0 z-[1400] block xl:hidden">
        <>
          <ServiceAvailabilityTicker />
          <NewsTicker />
          <div className="relative z-10">
            <AppBar
              position="static"
              color="transparent"
              elevation={0}
              className="bg-primary-bg/75 border-border-primary border-b backdrop-blur-lg"
            >
              <Toolbar className="flex items-center justify-between">
                <Box className="flex items-center">
                  <Link href="/" style={{ display: "block" }}>
                    <Image
                      src={
                        isCollabPage
                          ? `https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Transparent_${resolvedTheme === "dark" || resolvedTheme === "christmas" ? "Dark" : "Light"}.webp`
                          : "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent_Christmas.webp"
                      }
                      alt="Jailbreak Changelogs Logo"
                      width={200}
                      height={48}
                      quality={90}
                      priority
                      className="h-9 sm:h-12 w-auto"
                    />
                  </Link>
                </Box>
                <Box className="flex items-center gap-2">
                  {/* Notification icon */}
                  <Popover
                    open={notificationMenuOpen}
                    onOpenChange={(open) => {
                      setNotificationMenuOpen(open);
                      if (open && isAuthenticated) {
                        // Reset to unread tab when opening
                        setNotificationTab("unread");
                        setNotificationPage(1);
                        setMarkedAsSeen(new Set()); // Clear marked state
                        setIsLoadingNotifications(true); // Show loading immediately
                        setNotifications(null); // Clear old notifications
                        fetchUnreadWithDebounce(1, 5);
                      } else if (!open) {
                        // Reset state when closing
                        setNotifications(null);
                        setIsLoadingNotifications(false);
                        setMarkedAsSeen(new Set());
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="relative flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 p-1"
                        aria-label="Notifications"
                      >
                        <Icon
                          icon="mingcute:notification-line"
                          className="h-5 w-5 text-primary-text"
                          inline={true}
                        />
                        {isAuthenticated && (
                          <UnreadNotificationBadge count={unreadCount} />
                        )}
                      </button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="center"
                      side="bottom"
                      className="w-[calc(100vw-1rem)] max-w-md p-0"
                    >
                      {/* Header */}
                      <div className="border-border-secondary border-b px-4 py-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-primary-text font-semibold">
                            {notifications
                              ? `${notifications.total} ${notificationTab === "unread" ? "Unread " : ""}Notification${notifications.total !== 1 ? "s" : ""}`
                              : `0 ${notificationTab === "unread" ? "Unread " : ""}Notifications`}
                          </h3>
                          {notifications && notifications.total > 0 && (
                            <Tooltip
                              title={
                                notificationTab === "unread"
                                  ? "Clear Unread"
                                  : "Clear History"
                              }
                              arrow
                            >
                              <button
                                onClick={async () => {
                                  const success =
                                    notificationTab === "unread"
                                      ? await clearUnreadNotifications()
                                      : await clearNotificationHistory();
                                  if (success) {
                                    toast.success(
                                      notificationTab === "unread"
                                        ? "Cleared all unread notifications"
                                        : "Cleared notification history",
                                      {
                                        duration: 2000,
                                        position: "bottom-right",
                                      },
                                    );
                                    // Refetch to update the list
                                    setIsLoadingNotifications(true);
                                    const data =
                                      notificationTab === "unread"
                                        ? await fetchUnreadNotifications(1, 5)
                                        : await fetchNotificationHistory(1, 5);
                                    setNotifications(data);
                                    setNotificationPage(1);
                                    setIsLoadingNotifications(false);
                                    // Refresh unread count
                                    fetchUnreadCount();
                                  } else {
                                    toast.error(
                                      notificationTab === "unread"
                                        ? "Failed to clear unread notifications"
                                        : "Failed to clear notification history",
                                      {
                                        duration: 3000,
                                        position: "bottom-right",
                                      },
                                    );
                                  }
                                }}
                                className="text-secondary-text hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Icon
                                  icon="si:bin-fill"
                                  className="h-5 w-5"
                                  inline={true}
                                />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Tabs */}
                      {isAuthenticated && (
                        <div className="border-border-secondary border-b px-2">
                          <div role="tablist" className="tabs flex w-full">
                            <button
                              role="tab"
                              aria-selected={notificationTab === "unread"}
                              onClick={() => {
                                setNotificationTab("unread");
                                setNotificationPage(1);
                                setMarkedAsSeen(new Set()); // Clear marked state
                                setIsLoadingNotifications(true); // Show loading immediately
                                setNotifications(null); // Clear old notifications
                                fetchUnreadWithDebounce(1, 5);
                              }}
                              className={`tab flex-1 ${notificationTab === "unread" ? "tab-active" : ""}`}
                            >
                              Unread
                            </button>
                            <button
                              role="tab"
                              aria-selected={notificationTab === "history"}
                              onClick={() => {
                                setNotificationTab("history");
                                setNotificationPage(1);
                                setMarkedAsSeen(new Set()); // Clear marked state
                                setIsLoadingNotifications(true); // Show loading immediately
                                setNotifications(null); // Clear old notifications
                                fetchHistoryWithDebounce(1, 5);
                              }}
                              className={`tab flex-1 ${notificationTab === "history" ? "tab-active" : ""}`}
                            >
                              History
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="max-h-96 overflow-y-auto">
                        {isLoadingNotifications ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[200px]">
                            <div className="loading loading-spinner loading-md text-primary-text"></div>
                            <p className="text-secondary-text text-sm text-center mt-3">
                              Loading notifications...
                            </p>
                          </div>
                        ) : !isAuthenticated ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4">
                            <p className="text-secondary-text text-sm text-center">
                              You must be logged in to view notifications
                            </p>
                          </div>
                        ) : notifications && notifications.items.length > 0 ? (
                          <>
                            <div className="py-2">
                              {notifications.items.map((notif) => {
                                // Check if link domain is whitelisted and extract URL info
                                const urlInfo = (() => {
                                  try {
                                    const url = new URL(notif.link);
                                    const isJailbreakChangelogs =
                                      url.hostname ===
                                        "jailbreakchangelogs.xyz" ||
                                      url.hostname.endsWith(
                                        ".jailbreakchangelogs.xyz",
                                      );
                                    const isWhitelisted =
                                      isJailbreakChangelogs ||
                                      url.hostname === "google.com" ||
                                      url.hostname.endsWith(".google.com");

                                    if (isJailbreakChangelogs) {
                                      // Extract relative path (pathname + search + hash)
                                      const relativePath =
                                        url.pathname + url.search + url.hash;
                                      return {
                                        isWhitelisted: true,
                                        isJailbreakChangelogs: true,
                                        relativePath,
                                      };
                                    } else if (isWhitelisted) {
                                      return {
                                        isWhitelisted: true,
                                        isJailbreakChangelogs: false,
                                        href: notif.link,
                                      };
                                    }
                                    return { isWhitelisted: false };
                                  } catch {
                                    return { isWhitelisted: false };
                                  }
                                })();

                                return (
                                  <div
                                    key={notif.id}
                                    className="border-border-secondary hover:bg-secondary-bg block px-4 py-3 border-b last:border-b-0 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-primary-text text-sm font-semibold flex-1">
                                          {notif.title}
                                        </p>
                                        {notificationTab === "unread" && (
                                          <Tooltip
                                            title="Mark As Read"
                                            arrow
                                            placement="top"
                                          >
                                            <button
                                              onClick={async () => {
                                                // Optimistically remove from UI
                                                setNotifications((prev) => {
                                                  if (!prev) return prev;
                                                  return {
                                                    ...prev,
                                                    items: prev.items.filter(
                                                      (n) => n.id !== notif.id,
                                                    ),
                                                    total: prev.total - 1,
                                                  };
                                                });

                                                // Update unread count immediately
                                                setUnreadCount((prev) =>
                                                  Math.max(0, prev - 1),
                                                );

                                                // Mark as seen for visual feedback
                                                setMarkedAsSeen((prev) =>
                                                  new Set(prev).add(notif.id),
                                                );

                                                toast.success(
                                                  "Marked as read",
                                                  {
                                                    duration: 2000,
                                                    position: "bottom-right",
                                                  },
                                                );

                                                // Call API in background
                                                const success =
                                                  await markNotificationAsSeen(
                                                    notif.id,
                                                  );

                                                if (!success) {
                                                  // Revert on failure
                                                  toast.error(
                                                    "Failed to mark as read",
                                                    {
                                                      duration: 2000,
                                                      position: "bottom-right",
                                                    },
                                                  );
                                                  // Refetch to restore state
                                                  const data =
                                                    await fetchUnreadNotifications(
                                                      notificationPage,
                                                      5,
                                                    );
                                                  setNotifications(data);
                                                  fetchUnreadCount();
                                                }
                                              }}
                                              className={`flex-shrink-0 rounded-full p-1 transition-all cursor-pointer ${
                                                markedAsSeen.has(notif.id)
                                                  ? "bg-green-500/20 text-green-500"
                                                  : "bg-secondary-bg text-secondary-text hover:bg-tertiary-bg hover:text-primary-text"
                                              }`}
                                              aria-label="Mark as seen"
                                            >
                                              <Icon
                                                icon="proicons:checkmark"
                                                className="h-4 w-4"
                                                inline={true}
                                              />
                                            </button>
                                          </Tooltip>
                                        )}
                                      </div>
                                      <p className="text-secondary-text text-xs mt-1">
                                        {notif.description}
                                      </p>
                                      {urlInfo.isWhitelisted ? (
                                        urlInfo.isJailbreakChangelogs &&
                                        urlInfo.relativePath ? (
                                          <Link
                                            href={urlInfo.relativePath}
                                            prefetch={false}
                                            className="border-border-primary hover:border-border-focus bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors mt-2"
                                          >
                                            View
                                          </Link>
                                        ) : urlInfo.href ? (
                                          <a
                                            href={urlInfo.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="border-border-primary hover:border-border-focus bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors mt-2"
                                          >
                                            View
                                          </a>
                                        ) : null
                                      ) : (
                                        <p className="text-secondary-text text-xs mt-1 break-all">
                                          {notif.link}
                                        </p>
                                      )}
                                      <NotificationTimestamp
                                        timestamp={notif.last_updated}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {notifications.total_pages > 1 && (
                              <div className="border-border-secondary flex justify-center border-t py-3">
                                <Pagination
                                  count={notifications.total_pages}
                                  page={notificationPage}
                                  onChange={(_event, value) => {
                                    setNotificationPage(value);
                                    if (notificationTab === "history") {
                                      fetchHistoryWithDebounce(value, 5);
                                    } else {
                                      fetchUnreadWithDebounce(value, 5);
                                    }
                                  }}
                                  size="small"
                                  sx={{
                                    "& .MuiPaginationItem-root": {
                                      color: "var(--color-primary-text)",
                                      "&.Mui-selected": {
                                        backgroundColor:
                                          "var(--color-button-info)",
                                        color: "var(--color-form-button-text)",
                                        "&:hover": {
                                          backgroundColor:
                                            "var(--color-button-info-hover)",
                                        },
                                      },
                                      "&:hover": {
                                        backgroundColor:
                                          "var(--color-quaternary-bg)",
                                      },
                                    },
                                    "& .MuiPaginationItem-icon": {
                                      color: "var(--color-primary-text)",
                                    },
                                  }}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[200px]">
                            <Icon
                              icon="mingcute:notification-line"
                              className="text-secondary-text h-12 w-12 mb-3"
                              inline={true}
                            />
                            <p className="text-secondary-text text-sm text-center">
                              No new notifications
                            </p>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Link
                    href="/supporting"
                    className="flex items-center justify-center"
                  >
                    <button
                      className="flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Support us"
                    >
                      <Image
                        src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.svg"
                        alt="Ko-fi"
                        width={20}
                        height={20}
                        style={{ display: "block" }}
                      />
                    </button>
                  </Link>
                  <div className="flex items-center justify-center">
                    <AnimatedThemeToggler />
                  </div>
                  <button
                    onClick={handleDrawerToggle}
                    className="flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                    aria-label="toggle menu"
                  >
                    <svg
                      className="h-5 w-5 fill-current text-primary-text"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                    </svg>
                  </button>
                </Box>
              </Toolbar>
            </AppBar>
          </div>

          {/* Mobile Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="right"
              className="w-60 p-0 overflow-y-auto z-[1450]"
            >
              {drawer}
            </SheetContent>
          </Sheet>
        </>
      </div>

      <LoginModalWrapper
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <EscapeLoginModal />
    </>
  );
}
