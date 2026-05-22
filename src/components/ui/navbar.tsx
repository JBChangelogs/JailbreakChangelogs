"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { UserAvatar } from "@/utils/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@mui/material";
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
} from "@/utils/api";
import { formatCustomDate } from "@/utils/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { toast } from "sonner";
import {
  getNotificationActionLabel,
  parseNotificationUrl,
} from "@/utils/notificationUrl";

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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtmGeneratorModal } from "@/components/Modals/UtmGeneratorModal";
import { useToastRuntimeRightOffset } from "@/hooks/useToastRuntimeRightOffset";

const menuTransition = {
  type: "spring" as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
  wide = false,
  direction = 0,
}: {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
  wide?: boolean;
  direction?: number;
}) => {
  const isActive = active === item;
  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.span
        className={`flex cursor-pointer items-center gap-1 rounded-lg py-1 pr-2 pl-3 transition-colors duration-200 ${
          isActive
            ? "bg-button-info text-form-button-text"
            : "text-primary-text hover:bg-button-info-hover hover:text-form-button-text active:bg-button-info-active"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <span className="font-bold">{item}</span>
        <Icon
          icon={isActive ? "mdi:chevron-up" : "mdi:chevron-down"}
          className={`h-4 w-4 shrink-0 transition-colors duration-200 ${isActive ? "text-form-button-text" : "text-secondary-text"}`}
          inline={true}
        />
      </motion.span>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ x: direction * 48, opacity: direction !== 0 ? 0.4 : 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 48, opacity: direction !== 0 ? 0.4 : 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`absolute left-1/2 z-1300 mt-0 -translate-x-1/2 ${wide ? "min-w-[540px]" : "min-w-65"}`}
            style={{ top: "100%" }}
          >
            <motion.div
              layout
              transition={{
                type: "spring",
                mass: 0.4,
                damping: 16,
                stiffness: 220,
              }}
              className="border-border-card bg-primary-bg overflow-hidden rounded-2xl border backdrop-blur-sm"
            >
              <motion.div
                layout
                className={
                  wide
                    ? "grid grid-cols-2 gap-2 p-3"
                    : "flex flex-col gap-1 px-2 py-3"
                }
              >
                {children}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface HoveredLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  setActive?: (item: string | null) => void;
  [key: string]: unknown;
}

export const HoveredLink = ({
  children,
  href,
  className = "",
  setActive,
  ...rest
}: HoveredLinkProps) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={`text-primary-text hover:bg-button-info hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold transition-colors ${className}`}
        onClick={() => setActive?.(null)}
        {...rest}
      >
        {children}
      </Link>
    </motion.div>
  );
};

export const NavLink = ({
  href,
  children,
  className = "",
  setActive,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  setActive?: (item: string | null) => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setActive?.(null)}
    >
      <Link
        href={href}
        className={`text-primary-text hover:bg-button-info hover:text-form-button-text active:bg-button-info-active active:text-form-button-text rounded-lg px-3 py-1 font-bold transition-colors duration-200 ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
};

export const Badge = ({
  children,
  variant = "new",
}: {
  children: React.ReactNode;
  variant?: "new" | "coming-soon";
}) => {
  const baseClasses =
    "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase";
  const variantClasses =
    variant === "new"
      ? "bg-button-info border-border-card text-form-button-text"
      : "bg-button-info text-form-button-text";

  return <span className={`${baseClasses} ${variantClasses}`}>{children}</span>;
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

const UnreadNotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
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
    `notification-${notificationId}`,
  );

  return (
    <p className="text-secondary-text mt-1 text-right text-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{relativeTime}</span>
        </TooltipTrigger>
        <TooltipContent>
          {hasValidNumber ? formatCustomDate(timestampNumber) : timestampString}
        </TooltipContent>
      </Tooltip>
    </p>
  );
};

export const NavbarModern = ({
  className,
  unreadCount,
  setUnreadCount,
}: {
  className?: string;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const isXlUp = useMediaQuery("(min-width: 1280px)");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuWrapperRef = React.useRef<HTMLDivElement>(null);
  const userMenuDropdownRef = React.useRef<HTMLDivElement>(null);
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
  const [mounted, setMounted] = useState(false);

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

  const pathname = usePathname();
  const [navMenuValue, setNavMenuValue] = useState("");
  const navRootWrapperRef = React.useRef<HTMLDivElement>(null);
  const navViewportWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const navCursorRef = React.useRef({ x: 0, y: 0 });
  const triggerRefs = React.useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  const [viewportCenter, setViewportCenter] = useState<number | null>(null);

  React.useEffect(() => {
    if (
      navMenuValue &&
      triggerRefs.current[navMenuValue] &&
      navRootWrapperRef.current
    ) {
      const trigger = triggerRefs.current[navMenuValue]!;
      const root = navRootWrapperRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setViewportCenter(
        triggerRect.left - rootRect.left + triggerRect.width / 2,
      );
    }
  }, [navMenuValue]);

  // Passive global cursor tracker — keeps navCursorRef fresh without causing re-renders.
  React.useEffect(() => {
    const track = (e: MouseEvent) => {
      navCursorRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", track, { passive: true });
    return () => window.removeEventListener("mousemove", track);
  }, []);

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

    const onMove = (e: MouseEvent) => {
      navCursorRef.current = { x: e.clientX, y: e.clientY };
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
        Object.values(triggerRefs.current).some((el) => {
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

    window.addEventListener("mousemove", onMove);
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
    logout,
  } = useAuthContext();

  const { resolvedTheme } = useTheme();
  const userData = isAuthenticated ? authUser : null;
  const shouldShowSupportButton = (userData?.premiumtype ?? 0) <= 0;

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
        closeTimer = setTimeout(() => setUserMenuOpen(false), 100);
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [userMenuOpen]);

  useToastRuntimeRightOffset({
    enabled: isXlUp,
    rightOffset: notificationMenuOpen
      ? "500px"
      : userMenuOpen
        ? "304px"
        : "16px",
  });

  const isCollabPage =
    pathname === "/values" ||
    pathname.startsWith("/item") ||
    pathname.startsWith("/trading") ||
    pathname.startsWith("/values/changelogs");

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const displayNotifications = notifications;

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
                  : resolvedTheme === "og"
                    ? "/logos/OLD/JBCL_Long_Transparent.webp"
                    : "/logos/JBCL_Long_Transparent.webp"
              }
              alt="Jailbreak Changelogs Logo"
              width={213}
              height={48}
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
                    <NavDropdownItem
                      href="/values/changelogs"
                      icon="material-symbols:history-rounded"
                      title="Value Changelogs"
                      description="Dig into every value update — the reasoning, who voted, and who made the final call"
                      className="col-span-2"
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
              style={{
                position: "absolute",
                top: "100%",
                left: viewportCenter !== null ? `${viewportCenter}px` : "50%",
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
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    suppressHydrationWarning={true}
                    className="border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200"
                  >
                    <Icon
                      icon="mingcute:notification-line"
                      className="text-primary-text h-5 w-5"
                      inline={true}
                    />
                    {isAuthenticated && unreadCount > 0 && (
                      <UnreadNotificationBadge count={unreadCount} />
                    )}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <PopoverContent
              align="end"
              className="w-80 overflow-hidden rounded-2xl p-0"
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
                              const success = await clearNotificationHistory();
                              if (success) {
                                toast.success("Cleared notification history", {
                                  duration: 2000,
                                });
                                // Refetch to update the list
                                setIsLoadingNotifications(true);
                                const data = await fetchNotificationHistory(
                                  1,
                                  5,
                                );
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
                            data-rybbit-event={"Clear Notification History"}
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
                    value={notificationTab}
                    onValueChange={(value) => {
                      if (value !== "unread" && value !== "history") return;
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
                  <div className="flex min-h-50 flex-col items-center justify-center px-4 py-8">
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
                ) : displayNotifications &&
                  displayNotifications.items.length > 0 ? (
                  <>
                    <div className="py-2">
                      {displayNotifications.items.map((notif) => {
                        // Check if link domain is whitelisted and extract URL info
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
                            <NotificationTimestamp
                              timestamp={notif.last_updated}
                              notificationId={notif.id}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {displayNotifications.total_pages > 1 && (
                      <div className="border-border-secondary flex justify-center border-t py-3">
                        <Pagination
                          count={displayNotifications.total_pages}
                          page={notificationPage}
                          siblingCount={0}
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
          {!mounted ? (
            // Show login button during SSR and initial hydration to prevent mismatch
            <Button onClick={() => setShowLoginModal(true)}>Login</Button>
          ) : userData ? (
            <div ref={userMenuWrapperRef} className="relative">
              <button
                className="flex items-center gap-2 rounded-full p-1 transition-colors"
                onMouseEnter={() => setUserMenuOpen(true)}
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
              </button>

              {/* pointer-events disabled as soon as userMenuOpen is false so the
                  exit animation's ghost DOM doesn't capture clicks or hovers */}
              <div style={{ pointerEvents: userMenuOpen ? "auto" : "none" }}>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      ref={userMenuDropdownRef}
                      className="border-border-card bg-primary-bg absolute right-0 z-1300 mt-2 w-72 overflow-hidden rounded-2xl border shadow-lg"
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 8 }}
                      transition={menuTransition}
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
                          settings={userData.settings}
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
                              setUserMenuOpen(false);
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
      {/* Render the modal outside the dropdown but inside the component */}
      <UtmGeneratorModal
        isOpen={utmModalOpen}
        onClose={() => setUtmModalOpen(false)}
      />
    </div>
  );
};
