"use client";
import { createLogger } from "@/services/logger";
import React, { useState } from "react";

const log = createLogger("UI");
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useIsCollabPage } from "@/hooks/useIsCollabPage";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { UserAvatar } from "@/utils/ui/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationPopover } from "@/components/notifications/NotificationPopover";

const AnimatedThemeToggler = dynamic(
  () =>
    import("@/components/ui/animated-theme-toggler").then((mod) => ({
      default: mod.AnimatedThemeToggler,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200">
        <div className="h-5 w-5" />
      </div>
    ),
  },
);
import { Icon } from "./IconWrapper";
import { Button } from "./button";
import { useToastRuntimeRightOffset } from "@/hooks/useToastRuntimeRightOffset";

const menuTransition = {
  type: "spring" as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const NavDropdownItem = ({
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
  badge?: "coming-soon" | "new";
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
        "group flex items-start gap-3 rounded-xl bg-secondary-bg px-2 py-2 transition-colors hover:bg-tertiary-bg",
        className,
      )}
    >
      <div className="bg-button-info/15 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
        <Icon icon={icon} className="text-link h-4 w-4" inline={true} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-card-headline group-hover:text-link flex flex-wrap items-center gap-1.5 text-sm leading-tight font-semibold transition-colors">
          {title}
          {badge && (
            <span className="bg-button-info/20 text-link rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
              {badge === "coming-soon" ? "Soon" : "New"}
            </span>
          )}
        </div>
        <div className="text-card-paragraph mt-0.5 text-xs leading-relaxed">
          {description}
        </div>
      </div>
      <Icon
        icon="mdi:arrow-right"
        className="text-tertiary-text group-hover:text-link mt-1 h-4 w-4 shrink-0 transition-colors"
        inline={true}
      />
    </Link>
  );
};

export const NavbarModern = ({
  className,
  unreadCount,
  setUnreadCount,
  onUserMenuOpenChange,
  setUtmModalOpen,
}: {
  className?: string;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  onUserMenuOpenChange?: (open: boolean) => void;
  setUtmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const isXlUp = useMediaQuery("(min-width: 1280px)");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const setUserMenuOpenWithCallback = React.useCallback(
    (open: boolean) => {
      setUserMenuOpen(open);
      onUserMenuOpenChange?.(open);
    },
    [onUserMenuOpenChange],
  );
  const userMenuWrapperRef = React.useRef<HTMLDivElement>(null);
  const userMenuDropdownRef = React.useRef<HTMLDivElement>(null);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

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
    if (
      container &&
      navMenuValue &&
      triggerRefs.current[navMenuValue] &&
      navRootWrapperRef.current
    ) {
      const trigger = triggerRefs.current[navMenuValue]!;
      const root = navRootWrapperRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      container.style.left = `${triggerRect.left - rootRect.left + triggerRect.width / 2}px`;
    }
  }, [navMenuValue]);

  // Only pass-through open events — all closing is owned by the mousemove effect below.
  // Radix doesn't fire onValueChange("") when the cursor moves within the Root but off
  // a trigger (e.g. horizontal exit), so we can't rely on its close signal at all.
  const handleNavValueChange = (value: string) => {
    if (value !== "") setNavMenuValue(value);
  };

  // Prediction-cone / safe-triangle for the nav menu.
  // Mirrors the user-menu approach: global mousemove owns the close decision.
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
    isAuthenticated,
    isLoading,
    logout,
    wsConnected,
  } = useAuthContext();

  const { resolvedTheme } = useTheme();
  const userData = isAuthenticated ? authUser : null;
  const shouldShowSupportButton = (userData?.premiumtype ?? 0) <= 0;

  // Prediction-cone / safe-triangle for the user menu.
  // Replaces the old onMouseLeave timer. Tracks the cursor globally and keeps
  // the menu open while the pointer is inside the trigger, the dropdown panel,
  // OR the trapezoid between them (so diagonal movement toward any menu item
  // never accidentally closes it).
  React.useEffect(() => {
    if (!userMenuOpen) return;

    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const inRect = (x: number, y: number, r: DOMRect) =>
      x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

    // Linearly-interpolated trapezoid between wrapper bottom and dropdown top.
    // At y=wrapperRect.bottom the cone is as narrow as the trigger button;
    // at y=dropdownRect.top it is as wide as the dropdown panel.
    const inCone = (
      x: number,
      y: number,
      wr: DOMRect,
      dr: DOMRect,
    ): boolean => {
      if (y < wr.bottom || y > dr.top) return false;
      const t = (y - wr.bottom) / (dr.top - wr.bottom);
      const l = wr.left + t * (dr.left - wr.left);
      const r = wr.right + t * (dr.right - wr.right);
      return x >= l && x <= r;
    };

    const onMove = (e: MouseEvent) => {
      const wEl = userMenuWrapperRef.current;
      const dEl = userMenuDropdownRef.current;
      if (!wEl || !dEl) return;

      const { clientX: x, clientY: y } = e;
      const wr = wEl.getBoundingClientRect();
      const dr = dEl.getBoundingClientRect();

      const safe = inRect(x, y, wr) || inRect(x, y, dr) || inCone(x, y, wr, dr);

      if (safe) {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      } else if (!closeTimer) {
        closeTimer = setTimeout(() => setUserMenuOpenWithCallback(false), 100);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [userMenuOpen, setUserMenuOpenWithCallback]);

  useToastRuntimeRightOffset({
    enabled: isXlUp,
    rightOffset: notificationMenuOpen
      ? "500px"
      : userMenuOpen
        ? "304px"
        : "16px",
  });

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
      className={cn(
        "bg-primary-bg/90 border-border-card border-b backdrop-blur-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
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
              style={{
                height: "48px",
                width: "auto",
              }}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div
          ref={navRootWrapperRef}
          className="absolute left-1/2 -translate-x-1/2"
        >
          <NavigationMenu.Root
            style={{ position: "relative" }}
            delayDuration={0}
            value={navMenuValue}
            onValueChange={handleNavValueChange}
          >
            <NavigationMenu.List className="m-0 flex list-none items-center gap-2 p-0">
              {/* Updates */}
              <NavigationMenu.Item value="updates">
                <NavigationMenu.Trigger
                  ref={(el) => {
                    triggerRefs.current["updates"] = el;
                  }}
                  className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text data-[state=open]:bg-button-info data-[state=open]:text-form-button-text flex cursor-pointer items-center gap-1 rounded-lg py-1 pr-2 pl-3 font-bold transition-colors duration-200 focus:outline-none"
                >
                  Updates
                  <Icon
                    icon="mdi:chevron-down"
                    className="text-secondary-text group-data-[state=open]:text-form-button-text h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
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
                  <div className="grid w-[540px] grid-cols-2 gap-2 p-3">
                    <NavDropdownItem
                      href="/changelogs"
                      icon="material-symbols:article-rounded"
                      title="Game Changelogs"
                      description="Latest Jailbreak updates and patch notes"
                    />
                    <NavDropdownItem
                      href="/changelogs/timeline"
                      icon="material-symbols:schedule-rounded"
                      title="Timeline"
                      description="A simplified tree view of every update at a glance"
                    />
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              {/* Seasons */}
              <NavigationMenu.Item value="seasons">
                <NavigationMenu.Trigger
                  ref={(el) => {
                    triggerRefs.current["seasons"] = el;
                  }}
                  className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text data-[state=open]:bg-button-info data-[state=open]:text-form-button-text flex cursor-pointer items-center gap-1 rounded-lg py-1 pr-2 pl-3 font-bold transition-colors duration-200 focus:outline-none"
                >
                  Seasons
                  <Icon
                    icon="mdi:chevron-down"
                    className="text-secondary-text group-data-[state=open]:text-form-button-text h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
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
                  <div className="grid w-[540px] grid-cols-2 gap-2 p-3">
                    <NavDropdownItem
                      href="/seasons"
                      icon="material-symbols:layers-rounded"
                      title="Browse Seasons"
                      description="Explore all game seasons and rewards"
                    />
                    <NavDropdownItem
                      href="/seasons/leaderboard"
                      icon="material-symbols:leaderboard-rounded"
                      title="Season Leaderboard"
                      description="See top-ranked players this season"
                    />
                    <NavDropdownItem
                      href="/seasons/will-i-make-it"
                      icon="material-symbols:trending-up-rounded"
                      title="Will I Make It"
                      description="Enter your level and XP to see if you'll hit level 10 before the season ends"
                    />
                    <NavDropdownItem
                      href="/seasons/contracts"
                      icon="material-symbols:task-alt-rounded"
                      title="Weekly Contracts"
                      description="Check this week's contracts and plan ahead without launching the game"
                    />
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              {/* Trading */}
              <NavigationMenu.Item value="trading">
                <NavigationMenu.Trigger
                  ref={(el) => {
                    triggerRefs.current["trading"] = el;
                  }}
                  className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text data-[state=open]:bg-button-info data-[state=open]:text-form-button-text flex cursor-pointer items-center gap-1 rounded-lg py-1 pr-2 pl-3 font-bold transition-colors duration-200 focus:outline-none"
                >
                  Trading
                  <Icon
                    icon="mdi:chevron-down"
                    className="text-secondary-text group-data-[state=open]:text-form-button-text h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
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
                  <div className="grid w-[540px] grid-cols-2 gap-2 p-3">
                    <NavDropdownItem
                      href="/values"
                      icon="material-symbols:price-check-rounded"
                      title="Value List"
                      description="Browse current item values and track market trends"
                    />
                    <NavDropdownItem
                      href="/values/calculator"
                      icon="material-symbols:calculate-rounded"
                      title="Value Calculator"
                      description="Compare items and get fair trade valuations"
                    />
                    <NavDropdownItem
                      href="/items/suggestions"
                      icon="material-symbols:lightbulb-outline-rounded"
                      title="Item Suggestions"
                      description="Submit and vote on community value change suggestions"
                    />
                    <NavDropdownItem
                      href="/values/changelogs"
                      icon="material-symbols:history-rounded"
                      title="Value Changelogs"
                      description="Dig into every value update — the reasoning, who voted, and who made the final call"
                    />
                    <NavDropdownItem
                      href="/trading"
                      icon="material-symbols:swap-horiz-rounded"
                      title="Trade Ads"
                      description="Browse and post player trade listings"
                    />
                    <NavDropdownItem
                      href="/dupes"
                      icon="material-symbols:content-copy-rounded"
                      title="Dupe Finder"
                      description="Check if items are duped before you trade"
                    />
                    <NavDropdownItem
                      href="/inventories"
                      icon="material-symbols:inventory-2-rounded"
                      title="Inventory Checker"
                      description="View any player's full inventory and net worth"
                    />
                    <NavDropdownItem
                      href="/og"
                      icon="material-symbols:star-rounded"
                      title="OG Finder"
                      description="Discover who holds the rarest original items"
                    />
                    <NavDropdownItem
                      href="/hyperchrome-pity"
                      icon="material-symbols:percent-rounded"
                      title="Hyperchrome Pity"
                      description="Calculate how many robberies you need for the next Hyperchrome level"
                      className="col-span-2"
                    />
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              {/* Community */}
              <NavigationMenu.Item value="community">
                <NavigationMenu.Trigger
                  ref={(el) => {
                    triggerRefs.current["community"] = el;
                  }}
                  className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text data-[state=open]:bg-button-info data-[state=open]:text-form-button-text flex cursor-pointer items-center gap-1 rounded-lg py-1 pr-2 pl-3 font-bold transition-colors duration-200 focus:outline-none"
                >
                  Community
                  <Icon
                    icon="mdi:chevron-down"
                    className="text-secondary-text group-data-[state=open]:text-form-button-text h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
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
                  <div className="grid w-[540px] grid-cols-2 gap-2 p-3">
                    <NavDropdownItem
                      href="/users"
                      icon="material-symbols:person-search-rounded"
                      title="User Search"
                      description="Browse 30k+ Jailbreak Changelogs user profiles"
                      prefetch={false}
                    />
                    <NavDropdownItem
                      href="/robberies"
                      icon="material-symbols:local-police-rounded"
                      title="Robbery Tracker"
                      description="Track recent in-game robberies"
                    />
                    <NavDropdownItem
                      href="/bounties"
                      icon="mdi:currency-usd"
                      title="Bounty Tracker"
                      description="View and track active bounties"
                    />
                    <NavDropdownItem
                      href="/servers"
                      icon="material-symbols:groups-rounded"
                      title="Private Servers"
                      description="Find and join private servers"
                    />
                    <NavDropdownItem
                      href="/contributors"
                      icon="material-symbols:groups-rounded"
                      title="Meet the Team"
                      description="The people behind this site"
                    />
                    <NavDropdownItem
                      href="/testimonials"
                      icon="material-symbols:rate-review-rounded"
                      title="Testimonials"
                      description="What players say about us"
                    />
                    <NavDropdownItem
                      href="/supporting"
                      icon="material-symbols:favorite-rounded"
                      title="Support Us"
                      description="Unlock perks like ad removal, custom avatars, and more"
                      className="col-span-2"
                    />
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
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
                  borderRadius: "24px",
                  border: "1px solid var(--color-border-card)",
                  backgroundColor: "var(--color-primary-bg)",
                  backdropFilter: "blur(8px)",
                }}
              />
            </div>
          </NavigationMenu.Root>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated &&
            userData?.flags?.some((f) => f.flag === "is_owner") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent(
                          wsConnected
                            ? "realtimeManualDisconnect"
                            : "realtimeManualConnect",
                        ),
                      )
                    }
                    className="border-border-card bg-secondary-bg hover:bg-quaternary-bg flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {wsConnected
                    ? "WebSocket connected — click to disconnect"
                    : "WebSocket disconnected — click to reconnect"}
                </TooltipContent>
              </Tooltip>
            )}
          {/* Notification icon */}
          <NotificationPopover
            unreadCount={unreadCount}
            setUnreadCount={setUnreadCount}
            isAuthenticated={isAuthenticated}
            variant="desktop"
            onOpenChange={setNotificationMenuOpen}
          />

          {/* Messages button (desktop) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/messages" prefetch={false}>
                <button
                  className="border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200"
                  aria-label="Messages"
                >
                  <Icon
                    icon="ic:baseline-message"
                    className="text-primary-text h-5 w-5"
                    inline={true}
                  />
                </button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Messages</TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <AnimatedThemeToggler />

          {/* User menu or login button */}
          {isLoading ? (
            <Button onClick={() => setShowLoginModal(true)}>Login</Button>
          ) : userData ? (
            <div ref={userMenuWrapperRef} className="relative">
              <button
                className="flex items-center gap-2 rounded-full p-1 transition-colors"
                onMouseEnter={() => setUserMenuOpenWithCallback(true)}
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
              </button>

              {/* pointer-events disabled as soon as userMenuOpen is false so the
                  exit animation's ghost DOM doesn't capture clicks or hovers */}
              <div style={{ pointerEvents: userMenuOpen ? "auto" : "none" }}>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      ref={userMenuDropdownRef}
                      className="border-border-card bg-primary-bg absolute right-0 z-[2147483647] mt-2 w-72 overflow-hidden rounded-2xl border shadow-lg"
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 8 }}
                      transition={menuTransition}
                      onClick={() => setUserMenuOpenWithCallback(false)}
                    >
                      {/* User info */}
                      <Link
                        href={`/users/${userData.id}`}
                        className="group hover:bg-tertiary-bg flex items-center gap-3 p-3 transition-colors"
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
                          <div className="text-primary-text group-hover:text-link truncate font-semibold transition-colors">
                            {userData.global_name || userData.username}
                          </div>
                          <div className="text-secondary-text truncate text-xs">
                            @{userData.username}
                          </div>
                        </div>
                        <Icon
                          icon="material-symbols:chevron-right-rounded"
                          className="text-secondary-text group-hover:text-link h-4 w-4 shrink-0 transition-colors"
                          inline={true}
                        />
                      </Link>

                      {/* Menu items */}
                      <div className="border-border-secondary border-t p-2">
                        {!userData.roblox_id && (
                          <button
                            className="hover:bg-tertiary-bg flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
                            onClick={() =>
                              setLoginModal({ open: true, tab: "roblox" })
                            }
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
                          className="hover:bg-tertiary-bg flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
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

                        {shouldShowSupportButton && (
                          <Link
                            href="/supporting"
                            className="hover:bg-tertiary-bg flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
                          >
                            <div className="bg-button-info/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                              <Icon
                                icon="material-symbols:favorite-rounded"
                                className="text-link h-4 w-4"
                                inline={true}
                              />
                            </div>
                            <span className="text-primary-text text-sm font-medium">
                              Support Us
                            </span>
                          </Link>
                        )}

                        {userData?.flags?.some(
                          (f) => f.flag === "is_owner",
                        ) && (
                          <button
                            className="hover:bg-tertiary-bg flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
                            onClick={() => {
                              setUtmModalOpen(true);
                              setUserMenuOpenWithCallback(false);
                            }}
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
                          className="hover:bg-tertiary-bg flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
                          onClick={() => setUserMenuOpenWithCallback(false)}
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
                          className="hover:bg-button-danger/10 flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
                          onClick={handleLogout}
                          data-rybbit-event="Logout"
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowLoginModal(true)}>Login</Button>
          )}
        </div>
      </div>
    </div>
  );
};
