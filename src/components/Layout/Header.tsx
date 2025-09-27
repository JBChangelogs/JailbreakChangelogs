"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Typography,
  ListItemIcon,
  Divider,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useState, useEffect } from "react";
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
import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { useAuthContext } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();
  const isCollabPage =
    pathname === "/values" ||
    pathname.startsWith("/item") ||
    pathname.startsWith("/trading") ||
    pathname.startsWith("/values/changelogs");
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    showLoginModal,
    setShowLoginModal,
    user: authUser,
    isAuthenticated,
  } = useAuthContext();
  const userData = isAuthenticated ? authUser : null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [navMenuAnchorEl, setNavMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [communityMenuAnchorEl, setCommunityMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [seasonsMenuAnchorEl, setSeasonsMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [navMenuCloseTimeout, setNavMenuCloseTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [communityMenuCloseTimeout, setCommunityMenuCloseTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [seasonsMenuCloseTimeout, setSeasonsMenuCloseTimeout] =
    useState<NodeJS.Timeout | null>(null);
  useEscapeLogin();

  const navMenuButtonRef = useRef<HTMLDivElement | null>(null);
  const communityMenuButtonRef = useRef<HTMLDivElement | null>(null);
  const seasonsMenuButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    let loadingToast: string | undefined;

    try {
      // Show loading toast with deduplication
      loadingToast = showLogoutLoadingToast();

      trackLogoutSource("Header Component");
      await logout();
      handleMenuClose();

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

  const handleNavMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Close other menus immediately if they're open
    if (communityMenuAnchorEl) {
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
        setCommunityMenuCloseTimeout(null);
      }
      setCommunityMenuAnchorEl(null);
    }
    if (seasonsMenuAnchorEl) {
      if (seasonsMenuCloseTimeout) {
        clearTimeout(seasonsMenuCloseTimeout);
        setSeasonsMenuCloseTimeout(null);
      }
      setSeasonsMenuAnchorEl(null);
    }

    if (navMenuCloseTimeout) {
      clearTimeout(navMenuCloseTimeout);
      setNavMenuCloseTimeout(null);
    }
    setNavMenuAnchorEl(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    const timeout = setTimeout(() => {
      setNavMenuAnchorEl(null);
    }, 150);
    setNavMenuCloseTimeout(timeout);
  };

  const navMenuOpen = Boolean(navMenuAnchorEl);

  const handleCommunityMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Close other menus immediately if they're open
    if (navMenuAnchorEl) {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
        setNavMenuCloseTimeout(null);
      }
      setNavMenuAnchorEl(null);
    }
    if (seasonsMenuAnchorEl) {
      if (seasonsMenuCloseTimeout) {
        clearTimeout(seasonsMenuCloseTimeout);
        setSeasonsMenuCloseTimeout(null);
      }
      setSeasonsMenuAnchorEl(null);
    }

    if (communityMenuCloseTimeout) {
      clearTimeout(communityMenuCloseTimeout);
      setCommunityMenuCloseTimeout(null);
    }
    setCommunityMenuAnchorEl(event.currentTarget);
  };

  const handleCommunityMenuClose = () => {
    const timeout = setTimeout(() => {
      setCommunityMenuAnchorEl(null);
    }, 150);
    setCommunityMenuCloseTimeout(timeout);
  };

  const communityMenuOpen = Boolean(communityMenuAnchorEl);

  const handleSeasonsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Close other menus immediately if they're open
    if (navMenuAnchorEl) {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
        setNavMenuCloseTimeout(null);
      }
      setNavMenuAnchorEl(null);
    }
    if (communityMenuAnchorEl) {
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
        setCommunityMenuCloseTimeout(null);
      }
      setCommunityMenuAnchorEl(null);
    }

    if (seasonsMenuCloseTimeout) {
      clearTimeout(seasonsMenuCloseTimeout);
      setSeasonsMenuCloseTimeout(null);
    }
    setSeasonsMenuAnchorEl(event.currentTarget);
  };

  const handleSeasonsMenuClose = () => {
    const timeout = setTimeout(() => {
      setSeasonsMenuAnchorEl(null);
    }, 150);
    setSeasonsMenuCloseTimeout(timeout);
  };

  const seasonsMenuOpen = Boolean(seasonsMenuAnchorEl);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
      }
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
      }
      if (seasonsMenuCloseTimeout) {
        clearTimeout(seasonsMenuCloseTimeout);
      }
    };
  }, [navMenuCloseTimeout, communityMenuCloseTimeout, seasonsMenuCloseTimeout]);

  const drawer = (
    <List>
      {mounted && userData ? (
        <>
          <ListItem
            component={Link}
            href={`/users/${userData?.id}`}
            onClick={handleDrawerToggle}
            className="cursor-pointer"
          >
            <ListItemIcon>
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
            </ListItemIcon>
            <ListItemText primary="My account" />
          </ListItem>
          {!userData.roblox_id && (
            <ListItem
              component="div"
              onClick={() => {
                handleDrawerToggle();
                setShowLoginModal(true);
                const event = new CustomEvent("setLoginTab", { detail: 1 });
                window.dispatchEvent(event);
              }}
              className="cursor-pointer"
            >
              <ListItemIcon
                sx={{ color: "var(--color-primary-text) !important" }}
              >
                <RobloxIcon className="h-5 w-5" />
              </ListItemIcon>
              <ListItemText primary="Connect Roblox" />
            </ListItem>
          )}
          <ListItem
            component={Link}
            href="/settings"
            onClick={handleDrawerToggle}
            className="cursor-pointer"
          >
            <ListItemIcon>
              <SettingsIcon className="text-primary-text" />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                sx: { color: "var(--color-primary-text)" },
              }}
            />
          </ListItem>
          <ListItem
            component="div"
            onClick={handleLogout}
            className="cursor-pointer"
          >
            <ListItemIcon>
              <LogoutIcon className="text-button-danger" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                sx: { color: "var(--color-button-danger)" },
              }}
            />
          </ListItem>
        </>
      ) : (
        <>
          <ListItem>
            <Button
              variant="contained"
              onClick={() => {
                setShowLoginModal(true);
                handleDrawerToggle();
              }}
              className="bg-button-info text-form-button-text w-full"
            >
              Login
            </Button>
          </ListItem>
        </>
      )}

      <ListItem className="flex items-center justify-between">
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Game & Updates
        </Typography>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            color: "var(--color-primary-text) !important",
            "& .MuiSvgIcon-root": {
              color: "var(--color-primary-text) !important",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </ListItem>

      <ListItem
        component={Link}
        href="/changelogs"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Changelogs" />
      </ListItem>
      <ListItem
        component={Link}
        href="/seasons"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Browse Seasons" />
      </ListItem>
      <ListItem
        component={Link}
        href="/seasons/will-i-make-it"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText
          primary={
            <Box className="flex flex-wrap items-center gap-1">
              <span>Will I Make It</span>
              <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                New
              </span>
            </Box>
          }
        />
      </ListItem>
      <ListItem
        component={Link}
        href="/seasons/contracts"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText
          primary={
            <Box className="flex flex-wrap items-center gap-1">
              <span>Weekly Contracts</span>
              <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                New
              </span>
            </Box>
          }
        />
      </ListItem>
      <ListItem>
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Values
        </Typography>
      </ListItem>
      <ListItem
        component={Link}
        href="/values"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Value List" />
      </ListItem>
      <ListItem
        component={Link}
        href="/values/changelogs"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Value Changelogs" />
      </ListItem>
      <ListItem
        component={Link}
        href="/values/calculator"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Value Calculator" />
      </ListItem>
      <ListItem
        component={Link}
        href="/dupes"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText
          primary={
            <Box className="flex flex-wrap items-center gap-1">
              <span>Dupe Finder</span>
              {isFeatureEnabled("DUPE_FINDER") ? (
                <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  New
                </span>
              ) : (
                <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  Coming Soon
                </span>
              )}
            </Box>
          }
        />
      </ListItem>
      <ListItem
        component={Link}
        href="/dupes/calculator"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Dupe Calculator" />
      </ListItem>
      <ListItem
        component={Link}
        href="/trading"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Trade Ads" />
      </ListItem>
      <ListItem
        component={Link}
        href="/inventories"
        onClick={handleDrawerToggle}
        className="group cursor-pointer pl-4"
      >
        <ListItemText
          primary={
            <Box className="flex flex-wrap items-center gap-1">
              <span>Inventory Calculator</span>
              {isFeatureEnabled("INVENTORY_CALCULATOR") ? (
                <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  New
                </span>
              ) : (
                <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  Coming Soon
                </span>
              )}
            </Box>
          }
        />
      </ListItem>
      <ListItem
        component={Link}
        href="/og"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText
          primary={
            <Box className="flex flex-wrap items-center gap-1">
              <span>OG Finder</span>
              {isFeatureEnabled("OG_FINDER") ? (
                <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  New
                </span>
              ) : (
                <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  Coming Soon
                </span>
              )}
            </Box>
          }
        />
      </ListItem>
      <ListItem>
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Community
        </Typography>
      </ListItem>
      <ListItem
        component={Link}
        href="/users"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="User Search" />
      </ListItem>
      <ListItem
        component={Link}
        href="/crews"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText
          primary={
            <Box className="flex flex-wrap items-center gap-1">
              <span>Crew Leaderboard</span>
              <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                New
              </span>
            </Box>
          }
        />
      </ListItem>
      <ListItem
        component={Link}
        href="/leaderboard/money"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <Box className="flex items-center gap-1">
          <span>Money Leaderboard</span>
          <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
            New
          </span>
        </Box>
      </ListItem>
      <ListItem
        component={Link}
        href="/servers"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Private Servers" />
      </ListItem>
      <ListItem
        component={Link}
        href="/bot"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Discord Bot" />
      </ListItem>
      <ListItem
        component={Link}
        href="/faq"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="FAQ" />
      </ListItem>
      <ListItem
        component={Link}
        href="/contributors"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Meet the team" />
      </ListItem>

      <Divider className="my-4" />
    </List>
  );

  return (
    <>
      <AppBar
        position="sticky"
        className="bg-primary-bg/75 border-border-primary top-0 z-[1200] border-b backdrop-blur-lg"
      >
        <Toolbar className="flex items-center justify-between">
          <Box className="flex items-center">
            <Link href="/" style={{ display: "block" }}>
              <Image
                src={
                  isCollabPage
                    ? "/api/assets/logos/collab/JBCL_X_TC_Logo_Long_Transparent.webp"
                    : "/api/assets/logos/JBCL_Long_Transparent.webp"
                }
                alt="Jailbreak Changelogs Logo"
                width={isSmallScreen ? 150 : 200}
                height={isSmallScreen ? 36 : 48}
                quality={90}
                priority
                style={{
                  height: isSmallScreen ? "36px" : "48px",
                  width: "auto",
                }}
              />
            </Link>
          </Box>
          {mounted && !isMobile && (
            <>
              <Box className="absolute left-1/2 flex -translate-x-1/2 transform items-center gap-2">
                <Button
                  component={Link}
                  href="/changelogs"
                  className="text-primary-text hover:bg-button-info-hover active:bg-button-info-active active:text-form-button-text hover:text-form-button-text rounded-lg transition-colors duration-200"
                >
                  <Typography variant="button" className="font-bold">
                    Changelogs
                  </Typography>
                </Button>

                {/* Seasons Dropdown */}
                <Box
                  className="relative inline-block"
                  onMouseEnter={handleSeasonsMenuOpen}
                  onMouseLeave={handleSeasonsMenuClose}
                  ref={seasonsMenuButtonRef}
                >
                  <Button
                    type="button"
                    className={`rounded-lg transition-colors duration-200 ${
                      seasonsMenuOpen
                        ? "bg-button-info text-form-button-text"
                        : "text-primary-text hover:bg-button-info-hover hover:text-form-button-text active:bg-button-info-active"
                    }`}
                  >
                    <Typography
                      variant="button"
                      className={`font-bold ${seasonsMenuOpen ? "text-form-button-text" : ""}`}
                    >
                      Seasons
                    </Typography>
                    <motion.div
                      animate={{ rotate: seasonsMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <KeyboardArrowDownIcon
                        className={`ml-0.5 text-xl ${
                          seasonsMenuOpen
                            ? "text-form-button-text"
                            : "text-secondary-text"
                        }`}
                      />
                    </motion.div>
                  </Button>

                  <AnimatePresence>
                    {seasonsMenuOpen && (
                      <motion.div
                        className="bg-secondary-bg border-border-primary shadow-card-shadow absolute left-1/2 z-50 mt-0 min-w-[260px] -translate-x-1/2 rounded-2xl border shadow-lg"
                        style={{
                          top: "100%",
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <div className="flex flex-col gap-1 px-2 py-3">
                          <Link
                            href="/seasons"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleSeasonsMenuClose}
                          >
                            Browse Seasons
                          </Link>
                          <Link
                            href="/seasons/will-i-make-it"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleSeasonsMenuClose}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span>Will I Make It</span>
                              <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                New
                              </span>
                            </div>
                          </Link>
                          <Link
                            href="/seasons/contracts"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleSeasonsMenuClose}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span>Weekly Contracts</span>
                              <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                New
                              </span>
                            </div>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* Values Dropdown */}
                <Box
                  className="relative inline-block"
                  onMouseEnter={handleNavMenuOpen}
                  onMouseLeave={handleNavMenuClose}
                  ref={navMenuButtonRef}
                >
                  <Button
                    type="button"
                    className={`rounded-lg ${
                      navMenuOpen
                        ? "bg-button-info text-white"
                        : "text-primary-text hover:bg-button-info-hover hover:text-form-button-text"
                    }`}
                  >
                    <Typography
                      variant="button"
                      className={`font-bold ${navMenuOpen ? "text-white" : ""}`}
                    >
                      Values
                    </Typography>
                    <motion.div
                      animate={{ rotate: navMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <KeyboardArrowDownIcon
                        className={`ml-0.5 text-xl ${
                          navMenuOpen ? "text-white" : "text-secondary-text"
                        }`}
                      />
                    </motion.div>
                  </Button>

                  <AnimatePresence>
                    {navMenuOpen && (
                      <motion.div
                        className="bg-secondary-bg absolute left-1/2 z-50 mt-0 min-w-[260px] -translate-x-1/2 rounded-2xl shadow-2xl"
                        style={{
                          top: "100%",
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <div className="flex flex-col gap-1 px-2 py-3">
                          <Link
                            href="/values"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            Value List
                          </Link>
                          <Link
                            href="/values/changelogs"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            Value Changelogs
                          </Link>
                          <Link
                            href="/values/calculator"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            Value Calculator
                          </Link>
                          <Link
                            href="/dupes"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span>Dupe Finder</span>
                              {isFeatureEnabled("DUPE_FINDER") ? (
                                <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                  New
                                </span>
                              ) : (
                                <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                          </Link>
                          <Link
                            href="/dupes/calculator"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            Dupe Calculator
                          </Link>
                          <Link
                            href="/trading"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            Trade Ads
                          </Link>
                          <Link
                            href="/inventories"
                            className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span>Inventory Calculator</span>
                              {isFeatureEnabled("INVENTORY_CALCULATOR") ? (
                                <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                  New
                                </span>
                              ) : (
                                <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                          </Link>
                          <Link
                            href="/og"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleNavMenuClose}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span>OG Finder</span>
                              {isFeatureEnabled("OG_FINDER") ? (
                                <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                  New
                                </span>
                              ) : (
                                <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* Community Dropdown */}
                <Box
                  className="relative inline-block"
                  onMouseEnter={handleCommunityMenuOpen}
                  onMouseLeave={handleCommunityMenuClose}
                  ref={communityMenuButtonRef}
                >
                  <Button
                    type="button"
                    className={`rounded-lg ${
                      communityMenuOpen
                        ? "bg-button-info text-white"
                        : "text-primary-text hover:bg-button-info-hover hover:text-form-button-text"
                    }`}
                  >
                    <Typography
                      variant="button"
                      className={`font-bold ${communityMenuOpen ? "text-white" : ""}`}
                    >
                      Community
                    </Typography>
                    <motion.div
                      animate={{ rotate: communityMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <KeyboardArrowDownIcon
                        className={`ml-0.5 text-xl ${
                          communityMenuOpen
                            ? "text-white"
                            : "text-secondary-text"
                        }`}
                      />
                    </motion.div>
                  </Button>

                  <AnimatePresence>
                    {communityMenuOpen && (
                      <motion.div
                        className="bg-secondary-bg absolute left-1/2 z-50 mt-0 min-w-[260px] -translate-x-1/2 rounded-2xl shadow-2xl"
                        style={{
                          top: "100%",
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <div className="flex flex-col gap-1 px-2 py-3">
                          <Link
                            href="/users"
                            className="text-primary-text hover:bg-button-info-hover active:bg-button-info-active hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold transition-colors duration-200"
                            onClick={handleCommunityMenuClose}
                          >
                            User Search
                          </Link>
                          <Link
                            href="/crews"
                            className="text-primary-text hover:bg-button-info-hover active:bg-button-info-active hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold transition-colors duration-200"
                            onClick={handleCommunityMenuClose}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span>Crew Leaderboard</span>
                              <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                New
                              </span>
                            </div>
                          </Link>
                          <Link
                            href="/leaderboard/money"
                            className="text-primary-text hover:bg-button-info-hover active:bg-button-info-active hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold transition-colors duration-200"
                            onClick={handleCommunityMenuClose}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span>Money Leaderboard</span>
                              <span className="bg-button-info border-border-primary text-form-button-text rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                                New
                              </span>
                            </div>
                          </Link>
                          <Link
                            href="/servers"
                            className="text-primary-text hover:bg-button-info-hover active:bg-button-info-active hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold transition-colors duration-200"
                            onClick={handleCommunityMenuClose}
                          >
                            Private Servers
                          </Link>
                          <Link
                            href="/bot"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleCommunityMenuClose}
                          >
                            Discord Bot
                          </Link>
                          <Link
                            href="/faq"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleCommunityMenuClose}
                          >
                            FAQ
                          </Link>
                          <Link
                            href="/contributors"
                            className="text-primary-text hover:bg-button-info-hover hover:text-form-button-text block rounded-lg px-4 py-2 text-base font-bold"
                            onClick={handleCommunityMenuClose}
                          >
                            Meet the team
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Box>

              <Box className="ml-auto flex items-center gap-2">
                <Link href="/supporting">
                  <IconButton
                    className="hover:bg-quaternary-bg text-tertiary-text transition-colors duration-200"
                    aria-label="Support us"
                  >
                    <Image
                      src="/api/assets/images/kofi_assets/kofi_symbol.svg"
                      alt="Ko-fi"
                      width={22}
                      height={22}
                      style={{ display: "block" }}
                    />
                  </IconButton>
                </Link>
                <Tooltip
                  title="Join our Discord"
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
                  <IconButton
                    onClick={() => setIsDiscordModalOpen(true)}
                    className="text-button-info hover:bg-quaternary-bg transition-colors duration-200"
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
                  </IconButton>
                </Tooltip>

                <ThemeToggle />

                {userData ? (
                  <>
                    <Box
                      className="relative inline-block"
                      onMouseEnter={handleMenuOpen}
                      onMouseLeave={handleMenuClose}
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

                      <AnimatePresence>
                        {Boolean(anchorEl) && (
                          <motion.div
                            className="bg-secondary-bg absolute right-0 z-50 mt-0 min-w-[280px] rounded-2xl border border-white/[0.12] shadow-2xl"
                            style={{
                              top: "100%",
                            }}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{
                              duration: 0.2,
                              ease: [0.4, 0, 0.2, 1],
                              staggerChildren: 0.05,
                            }}
                          >
                            <div className="flex flex-col gap-1 px-2 py-3">
                              <Link
                                href={`/users/${String(userData?.id).replace(/\D/g, "")}`}
                                className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text flex items-center rounded-lg px-4 py-3 text-base font-bold transition-colors"
                                onClick={handleMenuClose}
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
                                <div className="ml-3">
                                  <div className="font-bold">
                                    {userData.username}
                                  </div>
                                  <div className="text-secondary-text group-hover:text-form-button-text text-sm">
                                    @{userData.username}
                                  </div>
                                </div>
                              </Link>

                              <div className="border-secondary-text my-1 border-t"></div>

                              {!userData.roblox_id && (
                                <button
                                  className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text flex w-full items-center rounded-lg px-4 py-2 text-base font-bold transition-colors"
                                  onClick={() => {
                                    handleMenuClose();
                                    setShowLoginModal(true);
                                    const event = new CustomEvent(
                                      "setLoginTab",
                                      { detail: 1 },
                                    );
                                    window.dispatchEvent(event);
                                  }}
                                >
                                  <RobloxIcon className="group-hover:text-form-button-text mr-3 h-5 w-5" />
                                  Connect Roblox
                                </button>
                              )}

                              <Link
                                href="/settings"
                                className="group text-primary-text hover:bg-button-info-hover hover:text-form-button-text flex items-center rounded-lg px-4 py-2 text-base font-bold transition-colors"
                                onClick={handleMenuClose}
                              >
                                <SettingsIcon className="text-primary-text group-hover:text-form-button-text mr-3 text-xl" />
                                Settings
                              </Link>

                              <button
                                className="text-button-danger hover:bg-button-danger/10 hover:text-button-danger flex w-full cursor-pointer items-center rounded-lg px-4 py-2 text-base font-bold transition-colors"
                                onClick={handleLogout}
                              >
                                <LogoutIcon className="text-button-danger mr-3 text-xl" />
                                Logout
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setShowLoginModal(true)}
                    className="bg-button-info active:bg-button-info-active text-form-button-text transition-colors duration-200"
                  >
                    <Typography variant="button">Login</Typography>
                  </Button>
                )}
              </Box>
            </>
          )}
          {mounted && isMobile && (
            <Box className="flex items-center gap-1">
              <Link href="/supporting">
                <IconButton
                  className="text-tertiary-text hover:bg-quaternary-bg transition-colors duration-200"
                  aria-label="Support us"
                >
                  <Image
                    src="/api/assets/images/kofi_assets/kofi_symbol.svg"
                    alt="Ko-fi"
                    width={22}
                    height={22}
                    style={{ display: "block" }}
                  />
                </IconButton>
              </Link>
              <Tooltip
                title="Join our Discord"
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
                <IconButton
                  onClick={() => setIsDiscordModalOpen(true)}
                  className="text-button-info hover:bg-quaternary-bg transition-colors duration-200"
                  sx={{
                    "@media (max-width: 374px)": {
                      display: "none",
                    },
                  }}
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
                </IconButton>
              </Tooltip>
              <ThemeToggle />
              <IconButton
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
                sx={{
                  color: "var(--color-primary-text) !important",
                  "& .MuiSvgIcon-root": {
                    color: "var(--color-primary-text) !important",
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        className="[&_.MuiDrawer-paper]:bg-primary-bg [&_.MuiDrawer-paper]:border-border-primary [&_.MuiDrawer-paper]:text-primary-text [&_.MuiDrawer-paper]:box-border [&_.MuiDrawer-paper]:w-60 [&_.MuiDrawer-paper]:border-l"
      >
        {drawer}
      </Drawer>
      <LoginModalWrapper
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <EscapeLoginModal />

      {/* Discord Modal */}
      {isDiscordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0"
            onClick={() => setIsDiscordModalOpen(false)}
          />
          <iframe
            src="https://discord.com/widget?id=1286064050135896064&theme=dark"
            width={isSmallScreen ? "350" : "750"}
            height={isSmallScreen ? "500" : "600"}
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="relative rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
