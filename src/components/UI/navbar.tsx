"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserAvatar, DefaultAvatar } from "@/utils/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { isFeatureEnabled } from "@/utils/featureFlags";
import dynamic from "next/dynamic";
import { Tooltip } from "@mui/material";

const ThemeToggle = dynamic(() => import("@/components/Layout/ThemeToggle"), {
  ssr: false,
  loading: () => (
    <div className="border-border-primary bg-secondary-bg text-secondary-text hover:text-primary-text hover:bg-quaternary-bg flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95">
      <div className="h-5 w-5" />
    </div>
  ),
});
import { Settings, LogOut } from "lucide-react";

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
        className={`flex cursor-pointer items-center transition-colors duration-200 ${
          active === item
            ? "bg-button-info text-form-button-text rounded-lg px-3 py-1"
            : "text-primary-text hover:bg-button-info-hover hover:text-form-button-text active:bg-button-info-active rounded-lg px-3 py-1"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <span className="font-bold">{item}</span>
        <motion.div
          animate={{ rotate: active === item ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <svg
            className={`ml-1 text-lg ${
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
              className="absolute left-1/2 z-50 mt-0 min-w-[260px] -translate-x-1/2 rounded-2xl shadow-lg"
              style={{ top: "100%" }}
            >
              <motion.div
                transition={menuTransition}
                layoutId="active"
                layout
                className="bg-secondary-bg border-border-primary shadow-card-shadow rounded-2xl border backdrop-blur-sm overflow-hidden"
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
  [key: string]: unknown;
}

export const HoveredLink = ({
  children,
  href,
  className = "",
  ...rest
}: HoveredLinkProps) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={`text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold transition-colors ${className}`}
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
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pathname = usePathname();
  const {
    setShowLoginModal,
    user: authUser,
    isAuthenticated,
    logout,
  } = useAuthContext();
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
        "bg-primary-bg/75 border-border-primary sticky top-0 z-[1200] border-b backdrop-blur-lg",
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
                  ? "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Transparent.webp"
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
            <HoveredLink href="/seasons">Browse Seasons</HoveredLink>
            <HoveredLink href="/seasons/will-i-make-it">
              <div className="flex items-center gap-2">
                <span>Will I Make It</span>
                <Badge variant="new">New</Badge>
              </div>
            </HoveredLink>
            <HoveredLink href="/seasons/contracts">
              <div className="flex items-center gap-2">
                <span>Weekly Contracts</span>
                <Badge variant="new">New</Badge>
              </div>
            </HoveredLink>
          </MenuItem>

          {/* Values */}
          <MenuItem setActive={setActive} active={active} item="Values">
            <HoveredLink href="/values">Value List</HoveredLink>
            <HoveredLink href="/values/changelogs">
              Value Changelogs
            </HoveredLink>
            <HoveredLink href="/values/calculator">
              Value Calculator
            </HoveredLink>
            <HoveredLink href="/dupes">
              <div className="flex items-center gap-2">
                <span>Dupe Finder</span>
                {isFeatureEnabled("DUPE_FINDER") ? (
                  <Badge variant="new">New</Badge>
                ) : (
                  <Badge variant="coming-soon">Coming Soon</Badge>
                )}
              </div>
            </HoveredLink>
            <HoveredLink href="/dupes/calculator">Dupe Calculator</HoveredLink>
            <HoveredLink href="/trading">Trade Ads</HoveredLink>
            <HoveredLink href="/inventories">
              <div className="flex items-center gap-2">
                <span>Inventory Calculator</span>
                {isFeatureEnabled("INVENTORY_CALCULATOR") ? (
                  <Badge variant="new">New</Badge>
                ) : (
                  <Badge variant="coming-soon">Coming Soon</Badge>
                )}
              </div>
            </HoveredLink>
            <HoveredLink href="/og">
              <div className="flex items-center gap-2">
                <span>OG Finder</span>
                {isFeatureEnabled("OG_FINDER") ? (
                  <Badge variant="new">New</Badge>
                ) : (
                  <Badge variant="coming-soon">Coming Soon</Badge>
                )}
              </div>
            </HoveredLink>
          </MenuItem>

          {/* Community */}
          <MenuItem setActive={setActive} active={active} item="Community">
            <HoveredLink href="/users">User Search</HoveredLink>
            <HoveredLink href="/crews">Crew Leaderboard</HoveredLink>
            <HoveredLink href="/leaderboard/money">
              Money Leaderboard
            </HoveredLink>
            <HoveredLink href="/servers">Private Servers</HoveredLink>
            <HoveredLink href="/bot">Discord Bot</HoveredLink>
            <HoveredLink href="/faq">FAQ</HoveredLink>
            <HoveredLink href="/contributors">Meet the team</HoveredLink>
          </MenuItem>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
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

          {/* Discord button */}
          <Tooltip
            title="Join the Discord"
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
            <button
              onClick={() => setIsDiscordModalOpen(true)}
              className="text-button-info hover:text-button-info-hover cursor-pointer p-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </button>
          </Tooltip>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu or login button */}
          {userData ? (
            <div
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button className="hover:bg-quaternary-bg flex items-center gap-2 rounded-full p-1 transition-colors">
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
                    className="bg-secondary-bg border-border-primary absolute right-0 z-50 mt-2 w-64 rounded-lg border py-2 shadow-lg backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.85, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 10 }}
                    transition={menuTransition}
                  >
                    {/* User info */}
                    <div className="border-border-secondary border-b px-4 py-3">
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
                          <div className="text-primary-text font-semibold">
                            {userData.username}
                          </div>
                          <div className="text-secondary-text text-sm">
                            @{userData.username}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href={`/users/${userData.id}`}
                        className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                      >
                        <div className="h-6 w-6 flex-shrink-0">
                          <DefaultAvatar />
                        </div>
                        My Account
                      </Link>

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
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>

                      <button
                        className="text-button-danger hover:bg-button-danger/10 hover:text-button-danger flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
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

      {/* Discord Modal */}
      {isDiscordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsDiscordModalOpen(false)}
          />
          <iframe
            src="https://discord.com/widget?id=1286064050135896064&theme=dark"
            width="750"
            height="600"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="relative rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
