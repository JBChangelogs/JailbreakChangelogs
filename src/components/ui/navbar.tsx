"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { UserAvatar } from "@/utils/ui/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { isFeatureEnabled } from "@/utils/config/featureFlags";
import dynamic from "next/dynamic";
import { Tooltip, Pagination } from "@mui/material";
import {
  fetchNotificationHistory,
  fetchUnreadNotifications,
  markNotificationAsSeen,
  clearUnreadNotifications,
  clearNotificationHistory,
  NotificationHistory,
} from "@/utils/api/api";
import { formatCompactDateTime } from "@/utils/helpers/timestamp";
import toast from "react-hot-toast";

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
import { Icon } from "./IconWrapper";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

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
}: {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
}) => {
  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.span
        className={`flex cursor-pointer items-center gap-1 rounded-lg py-1 pl-3 pr-2 transition-colors duration-200 ${
          active === item
            ? "bg-button-info text-form-button-text"
            : "text-primary-text hover:bg-button-info-hover hover:text-form-button-text active:bg-button-info-active"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <span className="font-bold">{item}</span>
        <motion.div
          animate={{ rotate: active === item ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0"
        >
          <svg
            className={`text-lg ${
              active === item ? "text-form-button-text" : "text-secondary-text"
            }`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </motion.div>
      </motion.span>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 10 }}
          transition={menuTransition}
        >
          {active === item && (
            <div
              className="absolute left-1/2 z-[1300] mt-0 min-w-[260px] -translate-x-1/2 rounded-2xl"
              style={{ top: "100%" }}
            >
              <motion.div
                transition={menuTransition}
                layoutId="active"
                layout
                className="bg-secondary-bg border-border-primary overflow-hidden rounded-2xl border backdrop-blur-sm"
              >
                <motion.div layout className="flex flex-col gap-1 px-2 py-3">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
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
        className={`text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold transition-colors ${className}`}
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
        className={`text-primary-text hover:bg-button-info-hover active:bg-button-info-active active:text-form-button-text hover:text-form-button-text rounded-lg px-3 py-1 font-bold transition-colors duration-200 ${className}`}
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
      ? "bg-button-info border-border-primary text-form-button-text"
      : "bg-button-info text-form-button-text";

  return <span className={`${baseClasses} ${variantClasses}`}>{children}</span>;
};

export const NavbarModern = ({ className }: { className?: string }) => {
  const [active, setActive] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  const pathname = usePathname();
  const {
    setShowLoginModal,
    user: authUser,
    isAuthenticated,
    logout,
  } = useAuthContext();
  const { resolvedTheme } = useTheme();
  const userData = isAuthenticated ? authUser : null;

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

  return (
    <div
      className={cn(
        "bg-primary-bg/75 border-border-primary border-b backdrop-blur-lg",
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
                  ? `https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Transparent_${resolvedTheme === "dark" ? "Dark" : "Light"}.webp`
                  : "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent.webp"
              }
              alt="Jailbreak Changelogs Logo"
              width={200}
              height={48}
              quality={90}
              priority
              style={{
                height: "48px",
                width: "auto",
              }}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div
          className="absolute left-1/2 flex -translate-x-1/2 transform items-center gap-2"
          onMouseLeave={() => setActive(null)}
        >
          {/* Changelogs */}
          <NavLink href="/changelogs" setActive={setActive}>
            Changelogs
          </NavLink>

          {/* Seasons */}
          <MenuItem setActive={setActive} active={active} item="Seasons">
            <HoveredLink href="/seasons" setActive={setActive}>
              Browse Seasons
            </HoveredLink>
            <HoveredLink href="/seasons/leaderboard" setActive={setActive}>
              <div className="flex items-center gap-2">
                <span>Season Leaderboard</span>
              </div>
            </HoveredLink>
            <HoveredLink href="/seasons/will-i-make-it" setActive={setActive}>
              <div className="flex items-center gap-2">
                <span>Will I Make It</span>
              </div>
            </HoveredLink>
            <HoveredLink href="/seasons/contracts" setActive={setActive}>
              <div className="flex items-center gap-2">
                <span>Weekly Contracts</span>
              </div>
            </HoveredLink>
          </MenuItem>

          {/* Calculators */}
          <NavLink href="/calculators" setActive={setActive}>
            Calculators
          </NavLink>

          {/* Values */}
          <MenuItem setActive={setActive} active={active} item="Values">
            <HoveredLink href="/values" setActive={setActive}>
              Value List
            </HoveredLink>
            <HoveredLink href="/values/changelogs" setActive={setActive}>
              Value Changelogs
            </HoveredLink>
            <HoveredLink href="/values/calculator" setActive={setActive}>
              Value Calculator
            </HoveredLink>
            <HoveredLink href="/dupes" setActive={setActive}>
              <div className="flex items-center gap-2">
                <span>Dupe Finder</span>
                {!isFeatureEnabled("DUPE_FINDER") && (
                  <Badge variant="coming-soon">Coming Soon</Badge>
                )}
              </div>
            </HoveredLink>
            <HoveredLink href="/dupes/calculator" setActive={setActive}>
              Dupe Calculator
            </HoveredLink>
            <HoveredLink href="/trading" setActive={setActive}>
              Trade Ads
            </HoveredLink>
            <HoveredLink href="/inventories" setActive={setActive}>
              <div className="flex items-center gap-2">
                <span>Inventory Checker</span>
                {!isFeatureEnabled("INVENTORY_CALCULATOR") && (
                  <Badge variant="coming-soon">Coming Soon</Badge>
                )}
              </div>
            </HoveredLink>
            <HoveredLink href="/og" setActive={setActive}>
              <div className="flex items-center gap-2">
                <span>OG Finder</span>
                {!isFeatureEnabled("OG_FINDER") && (
                  <Badge variant="coming-soon">Coming Soon</Badge>
                )}
              </div>
            </HoveredLink>
          </MenuItem>

          {/* Community */}
          <MenuItem setActive={setActive} active={active} item="Community">
            <HoveredLink href="/users" setActive={setActive} prefetch={false}>
              User Search
            </HoveredLink>
            <HoveredLink href="/leaderboard/money" setActive={setActive}>
              Money Leaderboard
            </HoveredLink>
            <HoveredLink href="/inventories/networth" setActive={setActive}>
              Networth Leaderboard
            </HoveredLink>
            <HoveredLink href="/servers" setActive={setActive}>
              Private Servers
            </HoveredLink>
            <HoveredLink href="/bot" setActive={setActive}>
              Discord Bot
            </HoveredLink>
            <HoveredLink href="/faq" setActive={setActive}>
              FAQ
            </HoveredLink>
            <HoveredLink href="/contributors" setActive={setActive}>
              Meet the team
            </HoveredLink>
            <HoveredLink href="/testimonials" setActive={setActive}>
              Testimonials
            </HoveredLink>
          </MenuItem>
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
                fetchUnreadWithDebounce(1, 5);
              }
            }}
          >
            <Tooltip
              title="Notifications"
              arrow
              placement="bottom"
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <PopoverTrigger asChild>
                <button className="border-border-primary bg-secondary-bg text-secondary-text hover:text-primary-text hover:bg-quaternary-bg flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200">
                  <Icon
                    icon="streamline-plump:mail-notification-remix"
                    className="h-5 w-5"
                    inline={true}
                  />
                </button>
              </PopoverTrigger>
            </Tooltip>

            <PopoverContent align="end" className="w-80 p-0">
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
                  <div role="tablist" className="tabs">
                    <button
                      role="tab"
                      aria-selected={notificationTab === "unread"}
                      onClick={() => {
                        setNotificationTab("unread");
                        setNotificationPage(1);
                        fetchUnreadWithDebounce(1, 5);
                      }}
                      className={`tab ${notificationTab === "unread" ? "tab-active" : ""}`}
                    >
                      Unread
                    </button>
                    <button
                      role="tab"
                      aria-selected={notificationTab === "history"}
                      onClick={() => {
                        setNotificationTab("history");
                        setNotificationPage(1);
                        fetchHistoryWithDebounce(1, 5);
                      }}
                      className={`tab ${notificationTab === "history" ? "tab-active" : ""}`}
                    >
                      History
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
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
                        // Check if link domain is whitelisted
                        const isWhitelistedDomain = (() => {
                          try {
                            const url = new URL(notif.link);
                            return (
                              url.hostname === "jailbreakchangelogs.xyz" ||
                              url.hostname === "www.jailbreakchangelogs.xyz" ||
                              url.hostname === "google.com" ||
                              url.hostname === "www.google.com"
                            );
                          } catch {
                            return false;
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
                                        const success =
                                          await markNotificationAsSeen(
                                            notif.id,
                                          );
                                        if (success) {
                                          setMarkedAsSeen((prev) =>
                                            new Set(prev).add(notif.id),
                                          );
                                          toast.success("Marked as read", {
                                            duration: 2000,
                                            position: "bottom-right",
                                          });
                                          // Refetch notifications to update the list
                                          setIsLoadingNotifications(true);
                                          const data =
                                            await fetchUnreadNotifications(
                                              notificationPage,
                                              5,
                                            );
                                          setNotifications(data);
                                          setIsLoadingNotifications(false);
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
                              {isWhitelistedDomain ? (
                                <a
                                  href={notif.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="border-border-primary hover:border-border-focus bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors mt-2"
                                >
                                  View
                                </a>
                              ) : (
                                <p className="text-secondary-text text-xs mt-1 break-all">
                                  {notif.link}
                                </p>
                              )}
                              <p className="text-secondary-text text-xs mt-1">
                                {formatCompactDateTime(notif.last_updated)}
                              </p>
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
                                backgroundColor: "var(--color-button-info)",
                                color: "var(--color-form-button-text)",
                                "&:hover": {
                                  backgroundColor:
                                    "var(--color-button-info-hover)",
                                },
                              },
                              "&:hover": {
                                backgroundColor: "var(--color-quaternary-bg)",
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
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <Icon
                      icon="streamline-plump:mail-notification-remix"
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

          {/* Support button */}
          <Tooltip
            title="Support us"
            arrow
            placement="bottom"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Link href="/supporting">
              <button className="text-tertiary-text hover:text-primary-text cursor-pointer p-2 transition-colors">
                <Image
                  src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.svg"
                  alt="Ko-fi"
                  width={22}
                  height={22}
                  style={{ display: "block" }}
                />
              </button>
            </Link>
          </Tooltip>

          {/* Theme toggle */}
          <AnimatedThemeToggler />

          {/* User menu or login button */}
          {userData ? (
            <div
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button className="flex items-center gap-2 rounded-full p-1 transition-colors">
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

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="bg-secondary-bg border-border-primary absolute right-0 z-[1300] mt-0 w-64 rounded-lg border py-2 shadow-lg backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.85, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 10 }}
                    transition={menuTransition}
                  >
                    {/* User info */}
                    <Link
                      href={`/users/${userData.id}`}
                      className="border-border-secondary hover:bg-button-info-hover/10 block border-b px-4 py-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
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
                        <div>
                          <div className="text-primary-text hover:text-link font-semibold transition-colors">
                            {userData.global_name || userData.username}
                          </div>
                          <div className="text-secondary-text text-sm">
                            @{userData.username}
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Menu items */}
                    <div className="py-1">
                      {!userData.roblox_id && (
                        <button
                          className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
                          onClick={() => {
                            setShowLoginModal(true);
                            const event = new CustomEvent("setLoginTab", {
                              detail: 1,
                            });
                            window.dispatchEvent(event);
                          }}
                        >
                          <RobloxIcon className="h-4 w-4" />
                          Connect Roblox
                        </button>
                      )}

                      <Link
                        href="/settings"
                        className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                      >
                        <Icon
                          icon="material-symbols:settings"
                          className="h-4 w-4"
                          inline={true}
                        />
                        Settings
                      </Link>

                      <button
                        className="text-button-danger hover:bg-button-danger/10 hover:text-button-danger flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
                        onClick={handleLogout}
                      >
                        <Icon
                          icon="material-symbols:logout"
                          className="h-4 w-4"
                          inline={true}
                        />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-button-info hover:bg-button-info-hover text-form-button-text cursor-pointer rounded-lg px-4 py-2 font-semibold transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
