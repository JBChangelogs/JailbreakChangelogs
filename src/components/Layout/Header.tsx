"use client";

import { createLogger } from "@/services/logger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const log = createLogger("UI");
import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useIsCollabPage } from "@/hooks/useIsCollabPage";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { logout, trackLogoutSource } from "@/utils/auth/auth";
import LoginModal from "../Auth/LoginModal";
import EscapeLoginModal from "../Auth/EscapeLoginModal";
import { useEscapeLogin } from "@/utils/auth/escapeLogin";
import { UserAvatar } from "@/utils/ui/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { useAuthContext } from "@/contexts/AuthContext";
import { canOverrideExperiments } from "@/utils/api/experiments";
import type { UserData } from "@/types/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { useWsConnectionPending } from "@/hooks/useWsConnectionPending";
import { Spinner } from "@/components/ui/Spinner";
import { syncDesktopNavigationPreferences } from "@/utils/ui/desktopNavigation";
import DesktopSidebar from "./DesktopSidebar";
import { navigationSections } from "@/utils/ui/navigation-menu";
import { getNavigationHref, getNavigationSection } from "@/utils/ui/navigation";
import { cn } from "@/lib/utils";

const AnimatedThemeToggler = dynamic(
  () =>
    import("@/components/ui/animated-theme-toggler").then((mod) => ({
      default: mod.AnimatedThemeToggler,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="text-primary-text hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200">
        <div className="h-4 w-4" />
      </div>
    ),
  },
);
import { NavbarModern } from "@/components/ui/navbar";
import ServiceAvailabilityTicker from "./ServiceAvailabilityTicker";
import NewsTicker from "./NewsTicker";
import type {
  NewsTickerAnnouncement,
  ServiceAlert,
} from "@/utils/api/runtimeFlags";
import OfflineDetector from "../OfflineDetector";

import { Icon } from "../ui/IconWrapper";
import { Button } from "../ui/button";
import {
  fetchUnreadMessageCount,
  fetchUnreadNotificationCount,
} from "@/utils/api/api";
import { UtmGeneratorModal } from "@/components/Modals/UtmGeneratorModal";
import { useToastRuntimeRightOffset } from "@/hooks/useToastRuntimeRightOffset";
import {
  NotificationPopover,
  UnreadBadge,
} from "@/components/notifications/NotificationPopover";

const MobileNavSection = ({
  title,
  sectionIcon,
  current,
  children,
  open,
  onToggle,
}: {
  title: string;
  sectionIcon: string;
  current: boolean;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) => {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-current={current ? "true" : undefined}
        className="group hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link aria-[current=true]:bg-tertiary-bg flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <Icon
            icon={sectionIcon}
            className="text-primary-text h-5 w-5 shrink-0"
            inline={true}
          />
          <span className="text-primary-text text-sm font-semibold">
            {title}
          </span>
        </div>
        <Icon
          icon="mdi:chevron-down"
          className="text-primary-text/70 h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out group-aria-expanded:rotate-180 motion-reduce:transition-none"
          inline={true}
        />
      </button>
      <div
        className="navigation-section-content"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <div>
          <div className="space-y-0.5 pb-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

const MobileNavItem = ({
  href,
  icon,
  label,
  badge,
  prefetch,
  current,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  prefetch?: boolean;
  current?: "page" | "location";
  onClick?: () => void;
}) => (
  <Link
    href={href}
    prefetch={prefetch}
    onClick={onClick}
    aria-current={current}
    className={cn(
      "hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link flex min-h-11 items-center gap-3 rounded-lg py-2 pr-3 pl-10 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
      current && "bg-button-info/10",
    )}
  >
    <Icon
      icon={icon}
      className="text-primary-text h-5 w-5 shrink-0"
      inline={true}
    />
    <span className="text-primary-text min-w-0 flex-1 truncate text-sm font-semibold">
      {label}
    </span>
    {badge && (
      <span className="bg-button-info/20 text-link ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
        {badge}
      </span>
    )}
  </Link>
);

const MobileDrawer = memo(function MobileDrawer({
  userData,
  openNavSection,
  currentSection,
  toggleNavSection,
  onClose,
  onLogout,
  setUtmModalOpen,
  wsConnected,
  wsTogglePending,
  onToggleWsConnection,
}: {
  userData: UserData | null;
  openNavSection: string;
  currentSection: string | null;
  toggleNavSection: (title: string) => void;
  onClose: () => void;
  onLogout: () => void;
  setUtmModalOpen: (open: boolean) => void;
  wsConnected: boolean;
  wsTogglePending: boolean;
  onToggleWsConnection: () => void;
}) {
  const { setLoginModal } = useAuthContext();
  const pathname = usePathname();
  const activeHref = getNavigationHref(pathname);

  return (
    <div className="flex h-full flex-col">
      {userData ? (
        <>
          <Link
            href={`/users/${userData?.id}`}
            onClick={onClose}
            className="hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link border-border-secondary flex w-full min-w-0 cursor-pointer items-center gap-3 border-b p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
          >
            <UserAvatar
              userId={userData.id}
              avatarHash={userData.avatar}
              username={userData.username}
              size={10}
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
                  onClose();
                  setLoginModal({ open: true, tab: "roblox" });
                }}
                className="hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <RobloxIcon className="text-primary-text h-5 w-5" />
                </div>
                <span className="text-primary-text text-sm font-semibold">
                  Connect Roblox
                </span>
              </button>
            )}
            <Link
              href="/settings"
              onClick={onClose}
              className="hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Icon
                  icon="material-symbols:settings-rounded"
                  className="text-primary-text h-5 w-5"
                  inline={true}
                />
              </div>
              <span className="text-primary-text text-sm font-semibold">
                Settings
              </span>
            </Link>
            {canOverrideExperiments(userData) && (
              <Link
                href="/experiments"
                onClick={onClose}
                className="hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <Icon
                    icon="mdi:flask-outline"
                    className="text-primary-text h-5 w-5"
                    inline={true}
                  />
                </div>
                <span className="text-primary-text text-sm font-semibold">
                  Experiments
                </span>
              </Link>
            )}
            {userData?.flags?.some((f) => f.flag === "is_owner") && (
              <>
                <button
                  type="button"
                  onClick={onToggleWsConnection}
                  disabled={wsTogglePending}
                  aria-label={
                    wsConnected
                      ? "Disconnect realtime connection"
                      : "Connect realtime connection"
                  }
                  title={
                    wsConnected
                      ? "Disconnect realtime connection"
                      : "Connect realtime connection"
                  }
                  className="hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {wsTogglePending ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"}`}
                      />
                    )}
                  </div>
                  <span className="text-primary-text min-w-0 flex-1 text-sm font-semibold">
                    Realtime connection
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setUtmModalOpen(true);
                  }}
                  className="hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <Icon
                      icon="heroicons:link"
                      className="text-primary-text h-5 w-5"
                      inline={true}
                    />
                  </div>
                  <span className="text-primary-text text-sm font-semibold">
                    Generate UTM Link
                  </span>
                </button>
              </>
            )}
            <Link
              href="/reports"
              onClick={onClose}
              className="hover:bg-quaternary-bg focus-visible:bg-quaternary-bg focus-visible:ring-link flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Icon
                  icon="heroicons:flag"
                  className="text-primary-text h-5 w-5"
                  inline={true}
                />
              </div>
              <span className="text-primary-text text-sm font-semibold">
                My Reports
              </span>
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="hover:bg-button-danger/10 focus-visible:bg-button-danger/10 focus-visible:ring-button-danger flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
              data-rybbit-event="Logout"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Icon
                  icon="material-symbols:logout-rounded"
                  className="text-button-danger h-5 w-5"
                  inline={true}
                />
              </div>
              <span className="text-button-danger text-sm font-semibold">
                Logout
              </span>
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2 p-2">
          <Link
            href="/settings"
            onClick={onClose}
            className="text-primary-text hover:bg-quaternary-bg focus-visible:ring-link flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon
              icon="material-symbols:settings-rounded"
              className="h-5 w-5"
            />
            Settings
          </Link>
          <Button
            className="min-h-11 w-full font-semibold"
            onClick={() => {
              setLoginModal({ open: true });
              onClose();
            }}
          >
            Login
          </Button>
        </div>
      )}

      <div className="border-border-card space-y-1 border-t p-2">
        {navigationSections.map((section) => (
          <MobileNavSection
            key={section.id}
            title={section.title}
            current={currentSection === section.id}
            sectionIcon={section.icon}
            open={openNavSection === section.id}
            onToggle={() => toggleNavSection(section.id)}
          >
            {section.items.map((item) => (
              <MobileNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.title}
                badge={item.badge === "live" ? "Live" : undefined}
                prefetch={item.prefetch}
                current={
                  activeHref === item.href
                    ? pathname === item.href
                      ? "page"
                      : "location"
                    : undefined
                }
                onClick={onClose}
              />
            ))}
          </MobileNavSection>
        ))}
      </div>

      <div className="border-border-card my-4 border-t" />
    </div>
  );
});

export default function Header() {
  const queryClient = useQueryClient();
  const isXlUp = useMediaQuery("(min-width: 1280px)");
  const isCollabPage = useIsCollabPage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(syncDesktopNavigationPreferences, []);
  const [openNavSection, setOpenNavSection] = useState<string>("updates");
  const toggleNavSection = useCallback(
    (title: string) =>
      setOpenNavSection((prev) => (prev === title ? "" : title)),
    [],
  );
  const [utmModalOpen, setUtmModalOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const hasWsUnreadSeedRef = useRef(false);
  const seenRealtimeMessageIdsRef = useRef(new Set<string>());
  const notificationCountRefreshTimeoutRef = useRef<number | null>(null);
  const notificationCountRequestRef = useRef(0);
  const messageCountRefreshTimeoutRef = useRef<number | null>(null);
  const messageCountRequestRef = useRef(0);

  const {
    user: authUser,
    isAuthenticated,
    isLoading,
    wsConnected,
  } = useAuthContext();
  const { isPending: wsTogglePending, toggleConnection: toggleWsConnection } =
    useWsConnectionPending(wsConnected);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const showAuth = mounted && !isLoading && isAuthenticated;
  const userData = showAuth ? authUser : null;
  useEscapeLogin();

  const pathname = usePathname();
  const [tickerFlags, setTickerFlags] = useState<{
    newsAnnouncement: NewsTickerAnnouncement | null;
    serviceAlert: ServiceAlert | null;
  }>({ newsAnnouncement: null, serviceAlert: null });

  // Include the path so a SPA navigation checks for updated ticker flags.
  const tickerFlagsQuery = useQuery({
    queryKey: ["ticker-flags", pathname],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/flags/tickers", { signal });
      if (!response.ok) throw new Error("Failed to fetch ticker flags");
      return response.json() as Promise<{
        newsAnnouncement: NewsTickerAnnouncement | null;
        serviceAlert: ServiceAlert | null;
      }>;
    },
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (tickerFlagsQuery.data) setTickerFlags(tickerFlagsQuery.data);
  }, [tickerFlagsQuery.data]);

  const refreshUnreadNotificationCount = useCallback(async () => {
    const requestId = ++notificationCountRequestRef.current;
    const count = await queryClient.fetchQuery({
      queryKey: ["notifications", "unread-count", authUser?.id],
      queryFn: fetchUnreadNotificationCount,
      staleTime: 0,
      gcTime: 0,
      retry: false,
    });
    if (requestId === notificationCountRequestRef.current && count !== null) {
      setUnreadCount(count);
    }
  }, [queryClient, authUser?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    void refreshUnreadNotificationCount();

    const scheduleRefresh = () => {
      if (notificationCountRefreshTimeoutRef.current !== null) {
        window.clearTimeout(notificationCountRefreshTimeoutRef.current);
      }
      notificationCountRefreshTimeoutRef.current = window.setTimeout(() => {
        notificationCountRefreshTimeoutRef.current = null;
        void refreshUnreadNotificationCount();
      }, 500);
    };

    window.addEventListener("focus", scheduleRefresh);
    return () => {
      window.removeEventListener("focus", scheduleRefresh);
      if (notificationCountRefreshTimeoutRef.current !== null) {
        window.clearTimeout(notificationCountRefreshTimeoutRef.current);
        notificationCountRefreshTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, refreshUnreadNotificationCount]);

  const refreshUnreadMessageCount = useCallback(async () => {
    const requestId = ++messageCountRequestRef.current;
    const count = await queryClient.fetchQuery({
      queryKey: ["messages", "unread-count", authUser?.id],
      queryFn: fetchUnreadMessageCount,
      staleTime: 0,
      gcTime: 0,
      retry: false,
    });
    if (requestId === messageCountRequestRef.current && count !== null) {
      setUnreadMessageCount(count);
    }
  }, [queryClient, authUser?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    void refreshUnreadMessageCount();

    const scheduleRefresh = () => {
      if (messageCountRefreshTimeoutRef.current !== null) {
        window.clearTimeout(messageCountRefreshTimeoutRef.current);
      }
      messageCountRefreshTimeoutRef.current = window.setTimeout(() => {
        messageCountRefreshTimeoutRef.current = null;
        void refreshUnreadMessageCount();
      }, 500);
    };

    const handleRealtimeMessage = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          action?: unknown;
          data?: { id?: unknown };
        }>
      ).detail;

      if (detail?.action === "message_received") {
        messageCountRequestRef.current += 1;
        const messageId = detail.data?.id;
        if (
          typeof messageId === "string" &&
          seenRealtimeMessageIdsRef.current.has(messageId)
        ) {
          return;
        }
        if (typeof messageId === "string") {
          if (seenRealtimeMessageIdsRef.current.size >= 500) {
            seenRealtimeMessageIdsRef.current.clear();
          }
          seenRealtimeMessageIdsRef.current.add(messageId);
        }
        setUnreadMessageCount((count) => count + 1);
        return;
      }

      if (detail?.action === "message_deleted") {
        scheduleRefresh();
      }
    };

    window.addEventListener("realtimeMessage", handleRealtimeMessage);
    window.addEventListener("messageThreadRead", scheduleRefresh);
    window.addEventListener("focus", scheduleRefresh);
    return () => {
      window.removeEventListener("realtimeMessage", handleRealtimeMessage);
      window.removeEventListener("messageThreadRead", scheduleRefresh);
      window.removeEventListener("focus", scheduleRefresh);
      if (messageCountRefreshTimeoutRef.current !== null) {
        window.clearTimeout(messageCountRefreshTimeoutRef.current);
        messageCountRefreshTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, refreshUnreadMessageCount]);

  useEffect(() => {
    if (isAuthenticated) return;
    messageCountRequestRef.current += 1;
    seenRealtimeMessageIdsRef.current.clear();
    setUnreadMessageCount(0);
  }, [isAuthenticated]);

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
          data?: { type?: unknown };
        }>
      ).detail;
      const totalNotifications =
        typeof detail?.total_notifications === "number"
          ? detail.total_notifications
          : null;
      const rawType = detail?.type ?? detail?.data?.type;
      const isBroadcast =
        typeof rawType === "string" &&
        rawType.trim().toLowerCase() === "broadcast";

      if (!isBroadcast) {
        notificationCountRequestRef.current += 1;
      }
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
    notificationCountRequestRef.current += 1;
    const timeoutId = setTimeout(() => {
      hasWsUnreadSeedRef.current = false;
      setUnreadCount(0);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated]);

  // Reset unread seed when WS drops so the next connection re-seeds the count.
  useEffect(() => {
    if (!wsConnected) {
      hasWsUnreadSeedRef.current = false;
    }
  }, [wsConnected]);

  const desktopHeaderRef = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const [desktopUserMenuOpen, setDesktopUserMenuOpen] = useState(false);

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

  const handleLogout = useCallback(async () => {
    try {
      trackLogoutSource("Header Component");
      await logout();
    } catch (err) {
      log.error("Logout error", err);
    }
  }, []);

  const handleDrawerToggle = useCallback(() => {
    if (!mobileOpen) {
      setOpenNavSection(getNavigationSection(pathname) ?? "updates");
    }
    setMobileOpen(!mobileOpen);
  }, [mobileOpen, pathname]);

  return (
    <>
      {/* Desktop navbar - hidden on mobile/tablet via CSS */}
      <div
        ref={desktopHeaderRef}
        className={`sticky top-0 hidden xl:block ${desktopUserMenuOpen ? "z-[2147483647]" : "z-1300"}`}
        style={{ viewTransitionName: "navbar" } as React.CSSProperties}
      >
        <ServiceAvailabilityTicker alert={tickerFlags.serviceAlert} />
        <OfflineDetector />
        <NewsTicker announcement={tickerFlags.newsAnnouncement} />
        <div className="relative z-10">
          <NavbarModern
            unreadCount={unreadCount}
            unreadMessageCount={unreadMessageCount}
            setUnreadCount={setUnreadCount}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() =>
              setSidebarCollapsed((collapsed) => !collapsed)
            }
            onUserMenuOpenChange={setDesktopUserMenuOpen}
            setUtmModalOpen={setUtmModalOpen}
          />
        </div>
      </div>

      <DesktopSidebar collapsed={sidebarCollapsed} />

      {/* Mobile header - hidden on desktop via CSS */}
      <div
        ref={mobileHeaderRef}
        className="sticky top-0 z-1400 block xl:hidden"
        style={{ viewTransitionName: "navbar-mobile" } as React.CSSProperties}
      >
        <>
          <ServiceAvailabilityTicker alert={tickerFlags.serviceAlert} />
          <OfflineDetector />
          <NewsTicker announcement={tickerFlags.newsAnnouncement} />
          <div className="relative z-10">
            <div className="bg-secondary-bg border-border-card border-b">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center">
                  <Link href="/" style={{ display: "block" }}>
                    <Image
                      src={
                        isCollabPage
                          ? `/logos/collab/JBCL_X_TC_Logo_Long_Transparent_${resolvedTheme === "dark" ? "Dark" : "Light"}.webp`
                          : "/logos/JBCL_Long_Transparent.webp"
                      }
                      alt="Jailbreak Changelogs Logo"
                      width={isCollabPage ? 148 : 256}
                      height={isCollabPage ? 48 : 58}
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
                  <NotificationPopover
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                    isAuthenticated={isAuthenticated}
                    variant="mobile"
                    onOpenChange={setNotificationMenuOpen}
                  />
                  {showAuth && (
                    <Link
                      href="/messages"
                      className="text-primary-text hover:bg-quaternary-bg focus-visible:ring-link relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
                      aria-label={`Messages${unreadMessageCount > 0 ? `, ${unreadMessageCount} unread` : ""}`}
                    >
                      <Icon
                        icon="ic:baseline-message"
                        className="h-4 w-4"
                        inline={true}
                      />
                      {unreadMessageCount > 0 && (
                        <UnreadBadge
                          count={unreadMessageCount}
                          variant="mobile"
                        />
                      )}
                    </Link>
                  )}
                  <div className="flex items-center justify-center">
                    <AnimatedThemeToggler
                      size="sm"
                      className="focus-visible:ring-link data-[state=open]:bg-quaternary-bg border-0 bg-transparent transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDrawerToggle}
                    className="hover:bg-quaternary-bg focus-visible:ring-link flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
                    aria-label="Open navigation menu"
                    aria-expanded={mobileOpen}
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
            <SheetContent
              side="right"
              overlayClassName="animation-duration-400 ease-in-out motion-reduce:animate-none"
              className="bg-secondary-bg animation-duration-800 fill-mode-both w-72 overflow-y-auto p-0 backdrop-blur-none transition-none ease-in-out will-change-transform motion-reduce:animate-none"
            >
              <MobileDrawer
                userData={userData}
                openNavSection={openNavSection}
                currentSection={mounted ? getNavigationSection(pathname) : null}
                toggleNavSection={toggleNavSection}
                onClose={handleDrawerToggle}
                onLogout={handleLogout}
                setUtmModalOpen={setUtmModalOpen}
                wsConnected={wsConnected}
                wsTogglePending={wsTogglePending}
                onToggleWsConnection={toggleWsConnection}
              />
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
