"use client";

import { createLogger } from "@/services/logger";
import Link from "next/link";

const log = createLogger("UI");
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Pagination } from "@/components/ui/Pagination";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { logout, trackLogoutSource } from "@/utils/auth/auth";
import { toast } from "sonner";
import LoginModal from "../Auth/LoginModal";
import EscapeLoginModal from "../Auth/EscapeLoginModal";
import { useEscapeLogin } from "@/utils/auth/escapeLogin";
import { UserAvatar } from "@/utils/ui/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Spinner } from "@/components/ui/Spinner";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchNotificationHistory,
  fetchUnreadNotificationCount,
  fetchUnreadNotifications,
  clearNotificationHistory,
  NotificationHistory,
  NotificationItem,
} from "@/utils/api/api";
import { formatCompactDateTime } from "@/utils/helpers/timestamp";
import {
  getNotificationActionLabel,
  parseNotificationUrl,
} from "@/utils/notifications/notificationUrl";
import { UtmGeneratorModal } from "@/components/Modals/UtmGeneratorModal";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { useToastRuntimeRightOffset } from "@/hooks/useToastRuntimeRightOffset";

const UnreadNotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();
  const isDoubleDigit = count > 9 && count <= 99;

  return (
    <span
      className={`absolute top-0 right-0 z-10 flex translate-x-1/4 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white ${
        isDoubleDigit || count > 99 ? "h-4 min-w-4 px-1" : "h-4 w-4"
      }`}
    >
      {displayCount}
    </span>
  );
};

const NotificationTimestamp = ({
  timestamp,
  notificationId,
}: {
  timestamp: string | number;
  notificationId: number;
}) => {
  const timestampString =
    typeof timestamp === "string" ? timestamp : timestamp.toString();
  const timestampNumber =
    typeof timestamp === "number" ? timestamp : Number.parseInt(timestamp, 10);
  const hasValidNumber = Number.isFinite(timestampNumber);
  const relativeTime = useOptimizedRealTimeRelativeDate(
    timestampString,
    `mobile-notification-${notificationId}`,
  );
  const isWithin24Hours =
    relativeTime === "just now" ||
    relativeTime.includes("second") ||
    relativeTime.includes("minute") ||
    relativeTime.includes("hour");

  const absoluteTime = hasValidNumber
    ? formatCompactDateTime(timestampNumber)
    : timestampString;

  return (
    <p className="text-secondary-text mt-1 text-right text-xs">
      <span>{isWithin24Hours ? relativeTime : absoluteTime}</span>
    </p>
  );
};

const getNotificationType = (
  notification:
    | NotificationItem
    | {
        type?: unknown;
        metadata?: Record<string, unknown> | null;
      },
): string | null => {
  if (typeof notification.type === "string" && notification.type.trim()) {
    return notification.type.trim().toLowerCase();
  }

  const metadata = notification.metadata;
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const metadataType = metadata.type;
  if (typeof metadataType === "string" && metadataType.trim()) {
    return metadataType.trim().toLowerCase();
  }

  return null;
};

const MobileNavSection = ({
  title,
  sectionIcon,
  children,
  open,
  onToggle,
}: {
  title: string;
  sectionIcon: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) => {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-button-info-hover/10 flex w-full items-center justify-between px-4 py-2.5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-button-info/15 flex h-6 w-6 items-center justify-center rounded-md">
            <Icon
              icon={sectionIcon}
              className="text-link h-3.5 w-3.5"
              inline={true}
            />
          </div>
          <span className="text-primary-text text-sm font-semibold">
            {title}
          </span>
        </div>
        <Icon
          icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
          className="text-secondary-text h-4 w-4 transition-colors duration-200"
          inline={true}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileNavItem = ({
  href,
  icon,
  label,
  badge,
  prefetch,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  prefetch?: boolean;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    prefetch={prefetch}
    onClick={onClick}
    className="hover:bg-button-info-hover/10 flex items-center gap-2.5 py-2 pr-3 pl-10 transition-colors"
  >
    <div className="bg-button-info/15 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
      <Icon icon={icon} className="text-link h-3.5 w-3.5" inline={true} />
    </div>
    <span className="text-primary-text min-w-0 flex-1 truncate text-sm">
      {label}
    </span>
    {badge && (
      <span className="bg-button-info/20 text-link ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
        {badge}
      </span>
    )}
  </Link>
);

export default function Header() {
  const pathname = usePathname();
  const isXlUp = useMediaQuery("(min-width: 1280px)");
  const isCollabPage =
    pathname === "/values" ||
    pathname.startsWith("/item") ||
    pathname.startsWith("/trading") ||
    pathname.startsWith("/values/changelogs") ||
    pathname.startsWith("/values/suggestions");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openNavSection, setOpenNavSection] = useState<string>("Updates");
  const toggleNavSection = (title: string) =>
    setOpenNavSection((prev) => (prev === title ? "" : title));
  const [utmModalOpen, setUtmModalOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"history" | "unread">(
    "unread",
  );
  const [notifications, setNotifications] =
    useState<NotificationHistory | null>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationTimeoutId, setNotificationTimeoutId] =
    useState<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasWsUnreadSeedRef = useRef(false);

  // Debounced notification fetching functions
  const fetchUnreadWithDebounce = (page: number, limit: number) => {
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingNotifications(true);
      let data = await fetchUnreadNotifications(page, limit);

      // When paginating, viewing each page marks those notifications as seen,
      // shrinking total_pages. If the requested page no longer exists, step
      // back to the previous page so the user sees the actual last page.
      if (data.items.length === 0 && page > 1) {
        const prevPage = page - 1;
        setNotificationPage(prevPage);
        data = await fetchUnreadNotifications(prevPage, limit);
      }

      setNotifications(data);
      const nextUnread =
        typeof data.unread_count === "number"
          ? data.unread_count
          : Math.max(0, data.total || 0);
      setUnreadCount(Math.max(0, nextUnread));
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
    setLoginModal,
    user: authUser,
    isAuthenticated,
    isLoading,
  } = useAuthContext();
  const { resolvedTheme } = useTheme();
  const showAuth = !isLoading && isAuthenticated;
  const userData = showAuth ? authUser : null;
  useEscapeLogin();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    void (async () => {
      const count = await fetchUnreadNotificationCount();
      if (cancelled) return;
      setUnreadCount(count);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, pathname]);

  useToastRuntimeRightOffset({
    enabled: !isXlUp,
    rightOffset: mobileOpen || notificationMenuOpen ? "256px" : "16px",
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNotificationReceived = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          total_notifications?: unknown;
          type?: unknown;
          data?: {
            type?: unknown;
            title?: string;
            description?: string;
            link?: string;
            metadata?: Record<string, unknown> | null;
          };
        }>
      ).detail;
      const totalNotifications =
        typeof detail?.total_notifications === "number"
          ? detail.total_notifications
          : null;
      const wsNotification = detail?.data;
      const notificationType = getNotificationType({
        type: detail?.type ?? detail?.data?.type,
        metadata: wsNotification?.metadata ?? null,
      });
      const isBroadcast = notificationType === "broadcast";

      setUnreadCount((prev) => {
        if (isBroadcast) return prev;
        if (totalNotifications !== null && !hasWsUnreadSeedRef.current) {
          hasWsUnreadSeedRef.current = true;
          return Math.max(0, totalNotifications);
        }
        return Math.max(0, prev + 1);
      });
    };

    window.addEventListener("notificationReceived", handleNotificationReceived);
    return () => {
      window.removeEventListener(
        "notificationReceived",
        handleNotificationReceived,
      );
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    const timeoutId = setTimeout(() => {
      hasWsUnreadSeedRef.current = false;
      setUnreadCount(0);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleConnectionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ connected?: boolean }>).detail;
      const connected = detail?.connected === true;
      if (!connected) {
        hasWsUnreadSeedRef.current = false;
      }
    };

    window.addEventListener(
      "realtimeNotificationsConnection",
      handleConnectionChange,
    );

    return () => {
      window.removeEventListener(
        "realtimeNotificationsConnection",
        handleConnectionChange,
      );
    };
  }, [isAuthenticated]);

  const displayNotifications = notifications;

  const desktopHeaderRef = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;
    let lastHeaderHeight = -1;

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

        // Avoid forcing style recalculation when value did not change.
        if (height !== lastHeaderHeight) {
          document.documentElement.style.setProperty(
            "--header-height",
            `${height}px`,
          );
          lastHeaderHeight = height;
        }
        frameId = 0;
      });
    };

    // Initial measurement
    updateHeaderHeight();

    // Set up listeners for things that can change the header height.
    window.addEventListener("resize", updateHeaderHeight);

    const observer = new ResizeObserver(updateHeaderHeight);
    if (desktopHeaderRef.current) observer.observe(desktopHeaderRef.current);
    if (mobileHeaderRef.current) observer.observe(mobileHeaderRef.current);

    return () => {
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
      log.error("Logout error", err);
      // Errors are now handled by toast.promise in logout()
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawer = (
    <div className="flex h-full flex-col">
      {userData ? (
        <>
          <Link
            href={`/users/${userData?.id}`}
            onClick={handleDrawerToggle}
            className="hover:bg-tertiary-bg border-border-secondary flex w-full min-w-0 cursor-pointer items-center gap-3 border-b p-3 transition-colors"
          >
            <UserAvatar
              userId={userData.id}
              avatarHash={userData.avatar}
              username={userData.username}
              size={10}
              custom_avatar={userData.custom_avatar}
              showBadge={false}
              settings={userData.settings_v2}
              premiumType={userData.premiumtype}
            />
            <div className="min-w-0 flex-1">
              <div className="text-primary-text truncate font-semibold">
                {userData.global_name || userData.username}
              </div>
              <div className="text-secondary-text truncate text-xs">
                @{userData.username}
              </div>
            </div>
            <Icon
              icon="material-symbols:chevron-right-rounded"
              className="text-secondary-text h-4 w-4 shrink-0"
              inline={true}
            />
          </Link>
          <div className="p-2">
            {!userData.roblox_id && (
              <button
                type="button"
                onClick={() => {
                  handleDrawerToggle();
                  setLoginModal({ open: true, tab: "roblox" });
                }}
                className="hover:bg-tertiary-bg flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
              >
                <div className="bg-button-info/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <RobloxIcon className="text-link h-4 w-4" />
                </div>
                <span className="text-primary-text text-sm font-medium">
                  Connect Roblox
                </span>
              </button>
            )}
            <Link
              href="/settings"
              onClick={handleDrawerToggle}
              className="hover:bg-tertiary-bg flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors"
            >
              <div className="bg-button-info/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <Icon
                  icon="material-symbols:settings-rounded"
                  className="text-link h-4 w-4"
                  inline={true}
                />
              </div>
              <span className="text-primary-text text-sm font-medium">
                Settings
              </span>
            </Link>
            {userData?.flags?.some((f) => f.flag === "is_owner") && (
              <button
                type="button"
                onClick={() => {
                  handleDrawerToggle();
                  setUtmModalOpen(true);
                }}
                className="hover:bg-tertiary-bg flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
              >
                <div className="bg-button-info/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <Icon
                    icon="heroicons:link"
                    className="text-link h-4 w-4"
                    inline={true}
                  />
                </div>
                <span className="text-primary-text text-sm font-medium">
                  Generate UTM Link
                </span>
              </button>
            )}
            <Link
              href="/reports"
              onClick={handleDrawerToggle}
              className="hover:bg-tertiary-bg flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors"
            >
              <div className="bg-button-info/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <Icon
                  icon="heroicons:flag"
                  className="text-link h-4 w-4"
                  inline={true}
                />
              </div>
              <span className="text-primary-text text-sm font-medium">
                My Reports
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hover:bg-button-danger/10 flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
              data-umami-event="Logout"
            >
              <div className="bg-button-danger/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <Icon
                  icon="material-symbols:logout-rounded"
                  className="text-button-danger h-4 w-4"
                  inline={true}
                />
              </div>
              <span className="text-button-danger text-sm font-medium">
                Logout
              </span>
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 py-3">
          <Button
            onClick={() => {
              setLoginModal({ open: true });
              handleDrawerToggle();
            }}
          >
            Login
          </Button>
        </div>
      )}

      <div className="border-border-card border-t">
        <MobileNavSection
          title="Updates"
          sectionIcon="material-symbols:article-rounded"
          open={openNavSection === "Updates"}
          onToggle={() => toggleNavSection("Updates")}
        >
          <MobileNavItem
            href="/changelogs"
            icon="material-symbols:article-rounded"
            label="Game Changelogs"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/changelogs/timeline"
            icon="material-symbols:schedule-rounded"
            label="Timeline"
            onClick={handleDrawerToggle}
          />
        </MobileNavSection>

        <MobileNavSection
          title="Seasons"
          sectionIcon="material-symbols:layers-rounded"
          open={openNavSection === "Seasons"}
          onToggle={() => toggleNavSection("Seasons")}
        >
          <MobileNavItem
            href="/seasons"
            icon="material-symbols:layers-rounded"
            label="Browse Seasons"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/seasons/leaderboard"
            icon="material-symbols:leaderboard-rounded"
            label="Season Leaderboard"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/seasons/will-i-make-it"
            icon="material-symbols:trending-up-rounded"
            label="Will I Make It"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/seasons/contracts"
            icon="material-symbols:task-alt-rounded"
            label="Weekly Contracts"
            onClick={handleDrawerToggle}
          />
        </MobileNavSection>

        <MobileNavSection
          title="Trading"
          sectionIcon="material-symbols:price-check-rounded"
          open={openNavSection === "Trading"}
          onToggle={() => toggleNavSection("Trading")}
        >
          <MobileNavItem
            href="/values"
            icon="material-symbols:price-check-rounded"
            label="Value List"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/values/calculator"
            icon="material-symbols:calculate-rounded"
            label="Value Calculator"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/values/suggestions"
            icon="material-symbols:lightbulb-outline-rounded"
            label="Value Suggestions"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/values/changelogs"
            icon="material-symbols:history-rounded"
            label="Value Changelogs"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/trading"
            icon="material-symbols:swap-horiz-rounded"
            label="Trade Ads"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/dupes"
            icon="material-symbols:content-copy-rounded"
            label="Dupe Finder"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/inventories"
            icon="material-symbols:inventory-2-rounded"
            label="Inventory Checker"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/og"
            icon="material-symbols:star-rounded"
            label="OG Finder"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/hyperchrome-pity"
            icon="material-symbols:percent-rounded"
            label="Hyperchrome Pity"
            onClick={handleDrawerToggle}
          />
        </MobileNavSection>

        <MobileNavSection
          title="Community"
          sectionIcon="material-symbols:groups-rounded"
          open={openNavSection === "Community"}
          onToggle={() => toggleNavSection("Community")}
        >
          <MobileNavItem
            href="/users"
            icon="material-symbols:person-search-rounded"
            label="User Search"
            prefetch={false}
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/robberies"
            icon="material-symbols:local-police-rounded"
            label="Robbery Tracker"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/bounties"
            icon="mdi:currency-usd"
            label="Bounty Tracker"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/servers"
            icon="material-symbols:groups-rounded"
            label="Private Servers"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/contributors"
            icon="material-symbols:groups-rounded"
            label="Meet the Team"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/testimonials"
            icon="material-symbols:rate-review-rounded"
            label="Testimonials"
            onClick={handleDrawerToggle}
          />
          <MobileNavItem
            href="/supporting"
            icon="material-symbols:favorite-rounded"
            label="Support Us"
            onClick={handleDrawerToggle}
          />
        </MobileNavSection>
      </div>

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
        style={{ viewTransitionName: "navbar" } as React.CSSProperties}
      >
        <OfflineDetector />
        <NewsTicker />
        <div className="relative z-10">
          <NavbarModern
            unreadCount={unreadCount}
            setUnreadCount={setUnreadCount}
          />
        </div>
      </div>

      {/* Mobile header - hidden on desktop via CSS */}
      <div
        ref={mobileHeaderRef}
        className="sticky top-0 z-1400 block xl:hidden"
        style={{ viewTransitionName: "navbar-mobile" } as React.CSSProperties}
      >
        <>
          <OfflineDetector />
          <NewsTicker />
          <div className="relative z-10">
            <div className="bg-primary-bg/75 border-border-card border-b backdrop-blur-lg">
              <div className="flex items-center justify-between px-4 py-1">
                <div className="flex items-center">
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
                      loading="eager"
                      unoptimized={false}
                      className="h-9 w-auto sm:h-12"
                    />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  {/* Notification icon */}
                  <Popover
                    open={notificationMenuOpen}
                    onOpenChange={(open) => {
                      setNotificationMenuOpen(open);
                      if (open && isAuthenticated) {
                        // Reset to unread tab when opening
                        setNotificationTab("unread");
                        setNotificationPage(1);
                        setIsLoadingNotifications(true); // Show loading immediately
                        setNotifications(null); // Clear old notifications
                        fetchUnreadWithDebounce(1, 5);
                      } else if (!open) {
                        // Reset state when closing
                        setNotifications(null);
                        setIsLoadingNotifications(false);
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
                        {showAuth && unreadCount > 0 && (
                          <UnreadNotificationBadge count={unreadCount} />
                        )}
                      </button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="center"
                      side="bottom"
                      className="w-[calc(100vw-1rem)] max-w-md overflow-hidden rounded-2xl p-0"
                    >
                      {/* Header */}
                      <div className="border-border-secondary border-b px-4 py-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-primary-text font-semibold">
                            {displayNotifications
                              ? `${displayNotifications.total} ${notificationTab === "unread" ? "Unread " : ""}Notification${displayNotifications.total !== 1 ? "s" : ""}`
                              : `0 ${notificationTab === "unread" ? "Unread " : ""}Notifications`}
                          </h3>
                          {notificationTab === "history" &&
                            displayNotifications &&
                            displayNotifications.total > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={async () => {
                                      const success =
                                        await clearNotificationHistory();
                                      if (success) {
                                        toast.success(
                                          "Cleared notification history",
                                          {
                                            duration: 2000,
                                          },
                                        );
                                        // Refetch to update the list
                                        setIsLoadingNotifications(true);
                                        const data =
                                          await fetchNotificationHistory(1, 5);
                                        setNotifications(data);
                                        setNotificationPage(1);
                                        setIsLoadingNotifications(false);
                                      } else {
                                        toast.error(
                                          "Failed to clear notification history",
                                          {
                                            duration: 3000,
                                          },
                                        );
                                      }
                                    }}
                                    data-umami-event={
                                      "Clear Notification History"
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
                                <TooltipContent>Clear History</TooltipContent>
                              </Tooltip>
                            )}
                        </div>
                      </div>

                      {/* Tabs */}
                      {showAuth && (
                        <div className="border-border-secondary border-b">
                          <Tabs
                            value={notificationTab}
                            onValueChange={(value) => {
                              if (value !== "unread" && value !== "history") {
                                return;
                              }
                              setNotificationTab(value);
                              setNotificationPage(1);
                              setIsLoadingNotifications(true); // Show loading immediately
                              setNotifications(null); // Clear old notifications
                              if (value === "unread") {
                                fetchUnreadWithDebounce(1, 5);
                                return;
                              }
                              fetchHistoryWithDebounce(1, 5);
                            }}
                          >
                            <TabsList
                              className="w-full rounded-none border-0 p-0"
                              fullWidth
                            >
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

                      {/* Manage Notifications Link */}
                      {showAuth && (
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
                          <div className="flex min-h-50 flex-col items-center justify-center px-4 py-8">
                            <Spinner className="h-8 w-8" />
                            <p className="text-secondary-text mt-3 text-center text-sm">
                              Loading notifications...
                            </p>
                          </div>
                        ) : !showAuth ? (
                          <div className="flex flex-col items-center justify-center px-4 py-8">
                            <p className="text-secondary-text text-center text-sm">
                              You must be logged in to view notifications
                            </p>
                          </div>
                        ) : displayNotifications &&
                          displayNotifications.items.length > 0 ? (
                          <>
                            <div className="py-2">
                              {displayNotifications.items.map((notif) => {
                                // Check if link domain is whitelisted and extract URL info
                                const urlInfo = parseNotificationUrl(
                                  notif.link,
                                );
                                const actionLabel =
                                  getNotificationActionLabel(urlInfo);
                                const shouldHideViewAction =
                                  notif.title.trim().toLowerCase() ===
                                  "login detected";

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
                                      </div>
                                      <p className="text-secondary-text mt-1 text-xs wrap-break-word whitespace-normal">
                                        {notif.description}
                                      </p>
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
                                              onClick={() =>
                                                setNotificationMenuOpen(false)
                                              }
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
                                              href={
                                                urlInfo.validatedExternalHref
                                              }
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
                                      <NotificationTimestamp
                                        timestamp={notif.last_updated}
                                        notificationId={notif.id}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {displayNotifications.total_pages > 1 && (
                              <div className="border-border-secondary flex justify-center border-t py-3">
                                <Pagination
                                  count={displayNotifications.total_pages}
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
                  {showAuth && (
                    <Link
                      href="/messages"
                      className="flex items-center justify-center"
                      aria-label="Messages"
                    >
                      <button
                        className="border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95"
                        aria-label="Messages"
                      >
                        <Icon
                          icon="ic:baseline-message"
                          className="text-primary-text h-4 w-4"
                          inline={true}
                        />
                      </button>
                    </Link>
                  )}
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
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="right" className="w-72 overflow-y-auto p-0">
              {drawer}
            </SheetContent>
          </Sheet>
        </>
      </div>

      <LoginModal />

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
