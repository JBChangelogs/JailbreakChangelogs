"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import { Pagination } from "@/components/ui/Pagination";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { logout, trackLogoutSource } from "@/utils/auth";
import { toast } from "sonner";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
import EscapeLoginModal from "../Auth/EscapeLoginModal";
import { useEscapeLogin } from "@/utils/escapeLogin";
import { UserAvatar } from "@/utils/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRef } from "react";

const AnimatedThemeToggler = dynamic(
  () =>
    import("@/components/ui/animated-theme-toggler").then((mod) => ({
      default: mod.AnimatedThemeToggler,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95">
        <div className="h-4 w-4" />
      </div>
    ),
  },
);
import { NavbarModern } from "@/components/ui/navbar";
import ServiceAvailabilityTicker from "./ServiceAvailabilityTicker";
import NewsTicker from "./NewsTicker";
import OfflineDetector from "../OfflineDetector";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Icon } from "../ui/IconWrapper";
import { Button } from "../ui/button";
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
import { parseNotificationUrl } from "@/utils/notificationUrl";
import { UtmGeneratorModal } from "@/components/Modals/UtmGeneratorModal";

const UnreadNotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();
  const isDoubleDigit = count > 9 && count <= 99;

  return (
    <span
      className={`absolute top-0 right-0 z-10 flex translate-x-1/4 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white ${
        isDoubleDigit || count > 99 ? "h-4 min-w-[16px] px-1" : "h-4 w-4"
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
    <p className="text-secondary-text mt-1 text-right text-xs">
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
  const [utmModalOpen, setUtmModalOpen] = useState(false);
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
    setTimeout(() => {
      fetchUnreadCount();
    }, 0);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        fetchUnreadCount();
      }, 0);
    }
  }, [pathname, isAuthenticated, fetchUnreadCount]);

  const desktopHeaderRef = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;

    const updateHeaderHeight = () => {
      if (frameId) return;

      frameId = requestAnimationFrame(() => {
        const desktopRect = desktopHeaderRef.current?.getBoundingClientRect();
        const mobileRect = mobileHeaderRef.current?.getBoundingClientRect();

        // Get the bottom-most point of whichever header is currently active
        const height = Math.max(
          0,
          desktopRect?.bottom ?? 0,
          mobileRect?.bottom ?? 0,
        );

        document.documentElement.style.setProperty(
          "--header-height",
          `${height}px`,
        );
        frameId = 0;
      });
    };

    // Initial measurement
    updateHeaderHeight();

    // Set up listeners for things that can change the height/position
    window.addEventListener("scroll", updateHeaderHeight, { passive: true });
    window.addEventListener("resize", updateHeaderHeight);

    const observer = new ResizeObserver(updateHeaderHeight);
    if (desktopHeaderRef.current) observer.observe(desktopHeaderRef.current);
    if (mobileHeaderRef.current) observer.observe(mobileHeaderRef.current);

    return () => {
      window.removeEventListener("scroll", updateHeaderHeight);
      window.removeEventListener("resize", updateHeaderHeight);
      if (frameId) cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    try {
      trackLogoutSource("Header Component");
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
      // Errors are now handled by toast.promise in logout()
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div className="flex h-full flex-col">
      {userData ? (
        <>
          <Link
            href={`/users/${userData?.id}`}
            onClick={handleDrawerToggle}
            className="hover:bg-button-info-hover/10 border-border-secondary flex w-full min-w-0 cursor-pointer items-center gap-3 border-b px-4 py-3 pr-8 transition-colors"
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
              <div className="text-primary-text max-w-[120px] truncate font-semibold">
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
              className="hover:bg-button-info-hover/10 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
            >
              <RobloxIcon className="text-primary-text h-5 w-5" />
              <span className="text-primary-text">Connect Roblox</span>
            </div>
          )}
          <Link
            href="/settings"
            onClick={handleDrawerToggle}
            className="hover:bg-button-info-hover/10 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
          >
            <Icon
              icon="material-symbols:settings"
              className="text-primary-text h-5 w-5"
              inline={true}
            />
            <span className="text-primary-text">Settings</span>
          </Link>
          {userData?.flags?.some((f) => f.flag === "is_owner") && (
            <div
              onClick={() => {
                handleDrawerToggle();
                setUtmModalOpen(true);
              }}
              className="hover:bg-button-info-hover/10 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
            >
              <Icon
                icon="heroicons:link"
                className="text-primary-text h-5 w-5"
                inline={true}
              />
              <span className="text-primary-text">Generate UTM Link</span>
            </div>
          )}
          <div
            onClick={handleLogout}
            className="hover:bg-button-info-hover/10 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
            data-umami-event="Logout"
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
          <Button
            onClick={() => {
              setShowLoginModal(true);
              handleDrawerToggle();
            }}
          >
            Login
          </Button>
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
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Changelogs
      </Link>
      <Link
        href="/seasons"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Browse Seasons
      </Link>
      <Link
        href="/seasons/leaderboard"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>Season Leaderboard</span>
        </Box>
      </Link>
      <Link
        href="/seasons/will-i-make-it"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        <Box className="flex flex-wrap items-center gap-1">
          <span>Will I Make It</span>
        </Box>
      </Link>
      <Link
        href="/seasons/contracts"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
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
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        All Calculators
      </Link>
      <Link
        href="/values#hyper-pity-calc"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Hyper Pity Calc
      </Link>
      <div className="px-4 py-2">
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Values
        </Typography>
      </div>
      <Link
        href="/values"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Value List
      </Link>
      <Link
        href="/values/changelogs"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Value Changelogs
      </Link>
      <Link
        href="/values/calculator"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Value Calculator
      </Link>
      <Link
        href="/trading"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Trade Ads
      </Link>
      <Link
        href="/dupes"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
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
        href="/inventories"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 group text-primary-text cursor-pointer px-8 py-2 transition-colors"
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
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
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
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        User Search
      </Link>
      <Link
        href="/leaderboard/money"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Money Leaderboard
      </Link>
      <Link
        href="/robberies"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Robbery Tracker
      </Link>
      <Link
        href="/bounties"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Bounty Tracker
      </Link>
      <Link
        href="/servers"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Private Servers
      </Link>
      <Link
        href="/contributors"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Meet the team
      </Link>
      <Link
        href="/testimonials"
        onClick={handleDrawerToggle}
        className="hover:bg-button-info-hover/10 text-primary-text cursor-pointer px-8 py-2 transition-colors"
      >
        Testimonials
      </Link>

      <div className="border-border-card my-4 border-t" />
    </div>
  );
  return (
    <>
      {/* Desktop navbar - hidden on mobile/tablet via CSS */}
      <ServiceAvailabilityTicker />

      {/* Desktop navbar - hidden on mobile/tablet via CSS */}
      <div
        ref={desktopHeaderRef}
        className="sticky top-0 z-1300 hidden xl:block"
      >
        <OfflineDetector />
        <NewsTicker />
        <div className="relative z-10">
          <NavbarModern
            unreadCount={unreadCount}
            setUnreadCount={setUnreadCount}
            fetchUnreadCount={async () => {
              await fetchUnreadCount();
            }}
          />
        </div>
      </div>

      {/* Mobile header - hidden on desktop via CSS */}
      <div
        ref={mobileHeaderRef}
        className="sticky top-0 z-1400 block xl:hidden"
      >
        <>
          <OfflineDetector />
          <NewsTicker />
          <div className="relative z-10">
            <AppBar
              position="static"
              color="transparent"
              elevation={0}
              className="bg-primary-bg/75 border-border-card border-b backdrop-blur-lg"
            >
              <Toolbar className="flex items-center justify-between">
                <Box className="flex items-center">
                  <Link href="/" style={{ display: "block" }}>
                    <Image
                      src={
                        isCollabPage
                          ? `/logos/collab/JBCL_X_TC_Logo_Long_Transparent_${resolvedTheme === "dark" ? "Dark" : "Light"}.webp`
                          : "/logos/JBCL_Long_Transparent.webp"
                      }
                      alt="Jailbreak Changelogs Logo"
                      width={213}
                      height={48}
                      quality={90}
                      fetchPriority="high"
                      unoptimized={false}
                      className="h-9 w-auto sm:h-12"
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
                        suppressHydrationWarning={true}
                        className="border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95"
                        aria-label="Notifications"
                      >
                        <Icon
                          icon="mingcute:notification-line"
                          className="text-primary-text h-4 w-4"
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
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                                        },
                                      );
                                      // Refetch to update the list
                                      setIsLoadingNotifications(true);
                                      const data =
                                        notificationTab === "unread"
                                          ? await fetchUnreadNotifications(1, 5)
                                          : await fetchNotificationHistory(
                                              1,
                                              5,
                                            );
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
                                        },
                                      );
                                    }
                                  }}
                                  data-umami-event={
                                    notificationTab === "unread"
                                      ? "Clear Unread Notifications"
                                      : "Clear Notification History"
                                  }
                                  className="text-secondary-text cursor-pointer transition-colors hover:text-red-500"
                                >
                                  <Icon
                                    icon="si:bin-fill"
                                    className="h-5 w-5"
                                    inline={true}
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {notificationTab === "unread"
                                  ? "Clear Unread"
                                  : "Clear History"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Tabs */}
                      {isAuthenticated && (
                        <div className="border-border-secondary border-b">
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

                      {/* Manage Notifications Link */}
                      {isAuthenticated && (
                        <div className="border-border-secondary bg-secondary-bg/30 border-b px-4 py-2">
                          <p className="text-secondary-text text-xs">
                            Manage which notifications you receive in{" "}
                            <Link
                              href="/settings?highlight=notifications"
                              className="text-link hover:underline"
                              onClick={() => setNotificationMenuOpen(false)}
                            >
                              Settings
                            </Link>
                          </p>
                        </div>
                      )}

                      {/* Content */}
                      <div className="max-h-96 overflow-y-auto">
                        {isLoadingNotifications ? (
                          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8">
                            <div className="loading loading-spinner loading-md text-primary-text"></div>
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
                                // Check if link domain is whitelisted and extract URL info
                                const urlInfo = parseNotificationUrl(
                                  notif.link,
                                );

                                return (
                                  <div
                                    key={notif.id}
                                    className="border-border-secondary hover:bg-secondary-bg block border-b px-4 py-3 transition-colors last:border-b-0"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-primary-text flex-1 text-sm font-semibold wrap-break-word whitespace-normal">
                                          {notif.title}
                                        </p>
                                        {notificationTab === "unread" && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button
                                                onClick={async () => {
                                                  // Optimistically remove from UI
                                                  setNotifications((prev) => {
                                                    if (!prev) return prev;
                                                    return {
                                                      ...prev,
                                                      items: prev.items.filter(
                                                        (n) =>
                                                          n.id !== notif.id,
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
                                                className={`shrink-0 cursor-pointer rounded-full p-1 transition-all ${
                                                  markedAsSeen.has(notif.id)
                                                    ? "bg-green-500/20 text-green-500"
                                                    : "bg-secondary-bg text-secondary-text hover:bg-tertiary-bg hover:text-primary-text"
                                                }`}
                                                data-umami-event="Mark Notification Read"
                                                aria-label="Mark as seen"
                                              >
                                                <Icon
                                                  icon="proicons:checkmark"
                                                  className="h-4 w-4"
                                                  inline={true}
                                                />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Mark As Read
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                      <p className="text-secondary-text mt-1 text-xs wrap-break-word whitespace-normal">
                                        {notif.description}
                                      </p>
                                      {urlInfo.isWhitelisted ? (
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
                                              onClick={() =>
                                                setNotificationMenuOpen(false)
                                              }
                                            >
                                              View
                                            </Link>
                                          </Button>
                                        ) : urlInfo.href ? (
                                          <Button
                                            variant="default"
                                            size="sm"
                                            asChild
                                            className="mt-2"
                                          >
                                            <a
                                              href={urlInfo.href}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              View
                                            </a>
                                          </Button>
                                        ) : null
                                      ) : (
                                        <p className="text-secondary-text mt-1 text-xs break-all">
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
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8">
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
                  <Link
                    href="/supporting"
                    className="flex items-center justify-center"
                  >
                    <button
                      className="border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Support us"
                    >
                      <Image
                        src="/logos/kofi_symbol.svg"
                        alt="Ko-fi"
                        width={18}
                        height={18}
                        style={{ display: "block" }}
                      />
                    </button>
                  </Link>
                  <div className="flex items-center justify-center">
                    <AnimatedThemeToggler size="sm" />
                  </div>
                  <button
                    onClick={handleDrawerToggle}
                    className="flex cursor-pointer items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    aria-label="toggle menu"
                  >
                    <svg
                      className="text-primary-text h-5 w-5 fill-current"
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
            <SheetContent side="right" className="w-60 overflow-y-auto p-0">
              {drawer}
            </SheetContent>
          </Sheet>
        </>
      </div>

      <LoginModalWrapper
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* EscapeLoginModal - Desktop only (no Escape key on mobile) */}
      <div className="hidden xl:block">
        <EscapeLoginModal />
      </div>

      <UtmGeneratorModal
        isOpen={utmModalOpen}
        onClose={() => setUtmModalOpen(false)}
      />
    </>
  );
}
