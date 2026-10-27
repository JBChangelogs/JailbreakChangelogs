"use client";
import { createLogger } from "@/services/logger";
import React, { useState } from "react";

const log = createLogger("UI");
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationSections } from "@/utils/ui/navigation-menu";
import NavigationLayoutShortcut from "@/components/Layout/NavigationLayoutShortcut";
import {
  getNavigationSection,
  getNavigationViewportCenter,
} from "@/utils/ui/navigation";
import GlobalSearchTip from "@/components/Layout/GlobalSearchTip";
import SiteLogo from "@/components/ui/SiteLogo";
import { NavigationMenu as NavigationMenu } from "radix-ui";
import { useIsCollabPage } from "@/hooks/useIsCollabPage";
import { getBrowserDownloadPlatform } from "@/app/app/platform";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { canOverrideExperiments } from "@/utils/api/experiments";
import { ExperimentOverridesBadge } from "@/components/Experiments/ExperimentOverridesIndicator";
import { UserAvatar } from "@/utils/ui/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import dynamic from "next/dynamic";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  NotificationPopover,
  UnreadBadge,
} from "@/components/notifications/NotificationPopover";

const ThemeShortcut = dynamic(
  () =>
    import("@/components/ui/animated-theme-toggler").then((mod) => ({
      default: mod.ThemeShortcut,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200">
        <div className="h-5 w-5" />
      </div>
    ),
  },
);
import { Icon } from "./IconWrapper";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const NavDropdownItem = ({
  href,
  icon,
  title,
  description,
  badge,
  setActive,
  className,
  prefetch,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: "coming-soon" | "new" | "live";
  setActive?: (item: string | null) => void;
  className?: string;
  prefetch?: boolean;
}) => {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={() => setActive?.(null)}
      className={cn(
        "focus-visible:ring-link flex items-start gap-3 rounded-md px-3 py-2 transition-colors hover:bg-tertiary-bg focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <Icon
        icon={icon}
        className="text-primary-text mt-0.5 h-5 w-5 shrink-0"
        inline={true}
      />
      <div className="min-w-0 flex-1">
        <div className="text-primary-text flex flex-wrap items-center gap-1.5 text-sm leading-tight font-semibold transition-colors">
          {title}
          {badge && (
            <span className="bg-menu-badge-bg text-menu-badge-text rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
              {badge === "coming-soon"
                ? "Soon"
                : badge === "live"
                  ? "Live"
                  : "New"}
            </span>
          )}
        </div>
        <div className="text-secondary-text mt-0.5 text-xs leading-relaxed">
          {description}
        </div>
      </div>
    </Link>
  );
};

export const NavbarModern = ({
  className,
  unreadCount,
  unreadMessageCount,
  setUnreadCount,
  onUserMenuOpenChange,
  setUtmModalOpen,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenSearch,
  searchOpen,
}: {
  className?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenSearch?: () => void;
  searchOpen: boolean;
  unreadCount: number;
  unreadMessageCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  onUserMenuOpenChange?: (open: boolean) => void;
  setUtmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const setUserMenuOpenWithCallback = React.useCallback(
    (open: boolean) => {
      setUserMenuOpen(open);
      onUserMenuOpenChange?.(open);
    },
    [onUserMenuOpenChange],
  );

  const isCollabPage = useIsCollabPage();
  const [navMenuValue, setNavMenuValue] = useState("");
  const navRootWrapperRef = React.useRef<HTMLDivElement>(null);
  const navViewportWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const navViewportContainerRef = React.useRef<HTMLDivElement>(null);
  const triggerRefs = React.useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );

  React.useEffect(() => {
    const container = navViewportContainerRef.current;
    const viewport = navViewportWrapperRef.current;
    const root = navRootWrapperRef.current;
    const trigger = triggerRefs.current[navMenuValue];
    if (!container || !viewport || !root || !trigger) return;

    const updatePosition = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const center = getNavigationViewportCenter(
        triggerRect.left + triggerRect.width / 2,
        viewport.offsetWidth,
        document.documentElement.clientWidth,
      );
      container.style.left = `${center - root.getBoundingClientRect().left}px`;
    };
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(viewport);
    observer.observe(root);
    window.addEventListener("resize", updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [navMenuValue]);

  // Only pass-through open events — all closing is owned by the mousemove effect below.
  // Radix doesn't fire onValueChange("") when the cursor moves within the Root but off
  // a trigger (e.g. horizontal exit), so we can't rely on its close signal at all.
  const handleNavValueChange = (value: string) => {
    if (value !== "") setNavMenuValue(value);
  };

  // Prediction-cone / safe-triangle for the nav menu.
  // Global mousemove owns the close decision.
  // Safe zone = active trigger rect ∪ any other trigger rect (smooth L↔R transitions)
  //           ∪ viewport rect ∪ trapezoid cone between trigger bottom and viewport top.
  React.useEffect(() => {
    if (!navMenuValue) return;

    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const activeValue = navMenuValue;
    // Cache trigger elements once per effect run — triggers don't change while a menu is open
    const triggerEls = Object.values(triggerRefs.current);

    const onMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;

      const activeTriggerEl = triggerRefs.current[activeValue];
      const vEl = navViewportWrapperRef.current;
      if (!activeTriggerEl || !vEl) return;

      const tr = activeTriggerEl.getBoundingClientRect();
      const vr = vEl.getBoundingClientRect();

      const inActiveTrigger =
        x >= tr.left && x <= tr.right && y >= tr.top && y <= tr.bottom;

      // Keep open when hovering any trigger so L↔R transitions don't flicker
      const inAnyTrigger =
        inActiveTrigger ||
        triggerEls.some((el) => {
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        });

      const inViewport =
        vr.height > 0 &&
        x >= vr.left &&
        x <= vr.right &&
        y >= vr.top &&
        y <= vr.bottom;

      const inCone = (() => {
        const gap = vr.top - tr.bottom;
        if (gap < 1 || y < tr.bottom || y > vr.top) return false;
        const t = (y - tr.bottom) / gap;
        return (
          x >= tr.left + t * (vr.left - tr.left) &&
          x <= tr.right + t * (vr.right - tr.right)
        );
      })();

      const safe = inAnyTrigger || inViewport || inCone;

      if (safe) {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      } else if (!closeTimer) {
        closeTimer = setTimeout(() => {
          setNavMenuValue((prev) => (prev === activeValue ? "" : prev));
        }, 80);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [navMenuValue]);
  const {
    setShowLoginModal,
    setLoginModal,
    user: authUser,
    isAuthenticated: isAuthenticatedRaw,
    isLoading: isLoadingRaw,
    logout,
  } = useAuthContext();

  // Auth resolves from cache in an effect, which can run before this Suspense
  // boundary hydrates; render the server's logged-out shape until mounted
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const searchShortcut =
    mounted && getBrowserDownloadPlatform() === "macOS" ? "⌘K" : "Ctrl K";
  const currentSection = mounted ? getNavigationSection(pathname) : null;
  const isLoading = !mounted || isLoadingRaw;
  const isAuthenticated = mounted && isAuthenticatedRaw;
  const userData = isAuthenticated ? authUser : null;
  const shouldShowSupportButton = (userData?.premiumtype ?? 0) <= 0;

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpenWithCallback(false);
    } catch (err) {
      log.error("Logout error", err);
    }
  };

  return (
    <div
      className={cn("bg-secondary-bg border-border-card border-b", className)}
    >
      <div className="relative flex h-15 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-desktop-sidebar-toggle
                onClick={onToggleSidebar}
                aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                aria-expanded={!sidebarCollapsed}
                aria-controls="desktop-sidebar-navigation"
                className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-link hidden size-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none 2xl:flex"
              >
                <svg
                  viewBox="0 0 512 512"
                  aria-hidden="true"
                  className="size-5 fill-current"
                >
                  <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            </TooltipContent>
          </Tooltip>
          <Link href="/" style={{ display: "block" }}>
            <SiteLogo
              collaboration={isCollabPage}
              alt="Jailbreak Changelogs Logo"
              width={isCollabPage ? 148 : 256}
              height={isCollabPage ? 48 : 58}
              quality={90}
              fetchPriority="high"
              loading="eager"
              style={{
                height: "40px",
                width: "auto",
              }}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div
          ref={navRootWrapperRef}
          data-desktop-top-navigation
          className="shrink-0"
        >
          <NavigationMenu.Root
            style={{ position: "relative" }}
            delayDuration={0}
            value={navMenuValue}
            onValueChange={handleNavValueChange}
          >
            <NavigationMenu.List className="m-0 flex list-none items-center gap-1 p-0 text-sm whitespace-nowrap 2xl:gap-2 2xl:text-base">
              {navigationSections.map((section) => (
                <NavigationMenu.Item key={section.id} value={section.id}>
                  <NavigationMenu.Trigger
                    aria-current={
                      currentSection === section.id ? "true" : undefined
                    }
                    ref={(el) => {
                      triggerRefs.current[section.id] = el;
                    }}
                    className="group text-primary-text hover:border-secondary-text aria-[current=true]:border-primary-text aria-[current=true]:hover:border-primary-text data-[state=open]:border-primary-text focus-visible:ring-link flex h-15 cursor-pointer items-center gap-1 border-b-2 border-transparent pr-2 pl-3 font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                  >
                    {section.title}
                    <Icon
                      icon="mdi:chevron-down"
                      className="text-secondary-text group-data-[state=open]:text-primary-text h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
                      inline={true}
                    />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      animationDuration: "0ms",
                      animationTimingFunction: "ease",
                    }}
                    onClick={() => setNavMenuValue("")}
                    className="data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight"
                  >
                    <div className="grid w-[540px] grid-cols-2 gap-1 p-2">
                      {section.items.map((item) => (
                        <NavDropdownItem key={item.href} {...item} />
                      ))}
                    </div>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              ))}
              {/* Arrow indicator — slides to track active trigger */}
              <NavigationMenu.Indicator
                style={{
                  position: "absolute",
                  top: "100%",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  height: "10px",
                  overflow: "hidden",
                  transition: "width 250ms ease, transform 250ms ease",
                }}
                className="data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut"
              >
                <svg
                  width="11"
                  height="5"
                  viewBox="0 0 11 5"
                  className="fill-border-primary"
                >
                  <path d="M0,5 L5.5,0 L11,5 Z" />
                </svg>
              </NavigationMenu.Indicator>
            </NavigationMenu.List>

            {/* Viewport */}
            <div
              ref={navViewportContainerRef}
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1300,
                perspective: "2000px",
              }}
            >
              <NavigationMenu.Viewport
                ref={navViewportWrapperRef}
                className="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut"
                style={{
                  position: "relative",
                  transformOrigin: "top center",
                  marginTop: "10px",
                  width: "var(--radix-navigation-menu-viewport-width)",
                  height: "var(--radix-navigation-menu-viewport-height)",
                  transition: "height 100ms ease",
                  overflow: "hidden",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border-card)",
                  backgroundColor: "var(--color-secondary-bg)",
                }}
              />
            </div>
          </NavigationMenu.Root>
        </div>

        {onOpenSearch && (
          <GlobalSearchTip searchOpen={searchOpen} onOpenSearch={onOpenSearch}>
            <button
              type="button"
              data-desktop-search
              onClick={onOpenSearch}
              aria-label={`Search the site (${searchShortcut})`}
              aria-keyshortcuts="Control+k Meta+k"
              aria-haspopup="dialog"
              className="text-secondary-text border-border-card bg-tertiary-bg hover:bg-quaternary-bg hover:text-primary-text focus-visible:ring-link flex h-10 w-40 max-w-md min-w-40 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon
                icon="heroicons:magnifying-glass"
                className="size-4 shrink-0"
              />
              <span>Search…</span>
              <kbd
                aria-hidden="true"
                className="border-border-card bg-secondary-bg ml-auto shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none"
              >
                {searchShortcut}
              </kbd>
            </button>
          </GlobalSearchTip>
        )}

        {/* Right side actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ExperimentOverridesBadge placement="header" />
          {/* Notification icon */}
          <NotificationPopover
            unreadCount={unreadCount}
            setUnreadCount={setUnreadCount}
            isAuthenticated={isAuthenticated}
            variant="desktop"
          />

          {/* Messages button (desktop) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/messages"
                prefetch={false}
                className={cn(
                  "hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-link relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none",
                  pathname.startsWith("/messages") || unreadMessageCount > 0
                    ? "text-primary-text"
                    : "text-secondary-text",
                )}
                aria-label={`Messages${unreadMessageCount > 0 ? `, ${unreadMessageCount} unread` : ""}`}
              >
                <Icon
                  icon="ic:baseline-message"
                  className="h-5 w-5"
                  inline={true}
                />
                {unreadMessageCount > 0 && (
                  <UnreadBadge count={unreadMessageCount} variant="desktop" />
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">Messages</TooltipContent>
          </Tooltip>

          {/* Theme settings shortcut */}
          <ThemeShortcut className="focus-visible:ring-link data-[state=open]:bg-quaternary-bg border-0 bg-transparent transition-colors focus-visible:ring-2 focus-visible:outline-none" />

          <NavigationLayoutShortcut />

          {/* User menu or login button */}
          {isLoading ? (
            <Button onClick={() => setShowLoginModal(true)}>Login</Button>
          ) : userData ? (
            <DropdownMenu
              open={userMenuOpen}
              onOpenChange={setUserMenuOpenWithCallback}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Account menu for ${userData.global_name || userData.username}`}
                  className="text-primary-text hover:bg-quaternary-bg focus-visible:ring-link data-[state=open]:bg-quaternary-bg flex h-10 cursor-pointer items-center gap-2 rounded-lg pr-1.5 pl-0.5 transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <UserAvatar
                    userId={userData.id}
                    avatarHash={userData.avatar}
                    username={userData.username}
                    size={8}
                    showBadge={false}
                    settings={userData.settings_v2}
                    premiumType={userData.premiumtype}
                  />
                  <span className="hidden max-w-28 truncate text-sm font-medium 2xl:block">
                    {userData.global_name || userData.username}
                  </span>
                  <Icon
                    icon="mdi:chevron-down"
                    className="text-secondary-text h-4 w-4 shrink-0"
                    inline={true}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                data-toast-avoid=""
                align="end"
                className="bg-secondary-bg z-[2147483647] w-64 rounded-lg p-1 shadow-lg"
              >
                <DropdownMenuItem
                  asChild
                  className="gap-3 rounded-md px-3 py-2.5"
                >
                  <Link href={`/users/${userData.id}`}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
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
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!userData.roblox_id && (
                  <DropdownMenuItem
                    onSelect={() =>
                      setLoginModal({ open: true, tab: "roblox" })
                    }
                    className="gap-3 rounded-md px-3 py-2.5"
                  >
                    <RobloxIcon className="text-secondary-text h-4 w-4" />
                    Connect Roblox
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  asChild
                  className="gap-3 rounded-md px-3 py-2.5"
                >
                  <Link href="/settings">
                    <Icon
                      icon="material-symbols:settings-rounded"
                      className="text-secondary-text h-4 w-4"
                      inline={true}
                    />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {canOverrideExperiments(userData) && (
                  <DropdownMenuItem
                    asChild
                    className="gap-3 rounded-md px-3 py-2.5"
                  >
                    <Link href="/experiments">
                      <Icon
                        icon="mdi:flask-outline"
                        className="text-secondary-text h-4 w-4"
                        inline={true}
                      />
                      Experiments
                    </Link>
                  </DropdownMenuItem>
                )}
                {shouldShowSupportButton && (
                  <DropdownMenuItem
                    asChild
                    className="gap-3 rounded-md px-3 py-2.5"
                  >
                    <Link href="/supporting">
                      <Icon
                        icon="material-symbols:favorite-rounded"
                        className="text-secondary-text h-4 w-4"
                        inline={true}
                      />
                      Support Us
                    </Link>
                  </DropdownMenuItem>
                )}
                {userData.flags?.some((f) => f.flag === "is_owner") && (
                  <DropdownMenuItem
                    onSelect={() => setUtmModalOpen(true)}
                    className="gap-3 rounded-md px-3 py-2.5"
                  >
                    <Icon
                      icon="heroicons:link"
                      className="text-secondary-text h-4 w-4"
                      inline={true}
                    />
                    Generate UTM Link
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  asChild
                  className="gap-3 rounded-md px-3 py-2.5"
                >
                  <Link href="/reports">
                    <Icon
                      icon="heroicons:flag"
                      className="text-secondary-text h-4 w-4"
                      inline={true}
                    />
                    My Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  data-rybbit-event="Logout"
                  className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger gap-3 rounded-md px-3 py-2.5"
                >
                  <Icon
                    icon="material-symbols:logout-rounded"
                    className="h-4 w-4"
                    inline={true}
                  />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setShowLoginModal(true)}>Login</Button>
          )}
        </div>
      </div>
    </div>
  );
};
