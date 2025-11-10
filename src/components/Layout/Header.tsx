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
  useTheme as useMuiTheme,
  Typography,
  ListItemIcon,
  Divider,
  Tooltip,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useState } from "react";
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
    import("@/components/UI/animated-theme-toggler").then((mod) => ({
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
import { NavbarModern } from "@/components/UI/navbar";
import ServiceAvailabilityTicker from "./ServiceAvailabilityTicker";

import { Icon } from "../UI/IconWrapper";

export default function Header() {
  const pathname = usePathname();
  const isCollabPage =
    pathname === "/values" ||
    pathname.startsWith("/item") ||
    pathname.startsWith("/trading") ||
    pathname.startsWith("/values/changelogs");
  const [mobileOpen, setMobileOpen] = useState(false);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("lg"), {
    noSsr: true,
  });
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const {
    showLoginModal,
    setShowLoginModal,
    user: authUser,
    isAuthenticated,
  } = useAuthContext();
  const { resolvedTheme } = useTheme();
  const userData = isAuthenticated ? authUser : null;
  useEscapeLogin();

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
    <List>
      {userData ? (
        <>
          <ListItem
            component={Link}
            href={`/users/${userData?.id}`}
            onClick={handleDrawerToggle}
            className="cursor-pointer hover:bg-button-info-hover/10"
            sx={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border-secondary)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0 w-full pr-8">
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
            </div>
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
              <Icon
                icon="material-symbols:settings"
                className="text-primary-text"
                inline={true}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ color: "var(--color-primary-text)" }}>
                  Settings
                </Typography>
              }
            />
          </ListItem>
          <ListItem
            component="div"
            onClick={handleLogout}
            className="cursor-pointer"
          >
            <ListItemIcon>
              <Icon
                icon="material-symbols:logout"
                className="text-button-danger"
                inline={true}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ color: "var(--color-button-danger)" }}>
                  Logout
                </Typography>
              }
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
              className="bg-button-info text-form-button-text"
            >
              Login
            </Button>
          </ListItem>
        </>
      )}

      <ListItem>
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Game & Updates
        </Typography>
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
        href="/seasons/leaderboard"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText
          primary={
            <Box className="flex flex-wrap items-center gap-1">
              <span>Season Leaderboard</span>
            </Box>
          }
        />
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
            </Box>
          }
        />
      </ListItem>
      <ListItem>
        <Typography className="text-secondary-text text-sm font-semibold tracking-wider uppercase">
          Calculators
        </Typography>
      </ListItem>
      <ListItem
        component={Link}
        href="/calculators"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="All Calculators" />
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
                <></>
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
              <span>Inventory Checker</span>
              {isFeatureEnabled("INVENTORY_CALCULATOR") ? (
                <></>
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
                <></>
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
        prefetch={false}
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="User Search" />
      </ListItem>
      <ListItem
        component={Link}
        href="/leaderboard/money"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Money Leaderboard" />
      </ListItem>
      <ListItem
        component={Link}
        href="/inventories/networth"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Networth Leaderboard" />
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
      <ListItem
        component={Link}
        href="/testimonials"
        onClick={handleDrawerToggle}
        className="cursor-pointer pl-4"
      >
        <ListItemText primary="Testimonials" />
      </ListItem>

      <Divider className="my-4" />
    </List>
  );

  return (
    <>
      {/* Desktop: Use new navbar */}
      {!isMobile && (
        <div className="sticky top-0 z-[1300]">
          <ServiceAvailabilityTicker />
          <div className="relative z-10">
            <NavbarModern />
          </div>
        </div>
      )}

      {/* Mobile: Use original header with drawer */}
      {isMobile && (
        <>
          {/* Fixed menu toggle button */}
          <label
            className="swap swap-rotate cursor-pointer fixed top-[14px] right-4 z-[1500]"
            aria-label="toggle menu"
          >
            <input
              type="checkbox"
              checked={mobileOpen}
              onChange={handleDrawerToggle}
            />

            {/* hamburger icon */}
            <svg
              className="swap-off fill-current text-primary-text"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 512 512"
            >
              <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
            </svg>

            {/* close icon */}
            <svg
              className="swap-on fill-current text-primary-text"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 512 512"
            >
              <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
            </svg>
          </label>

          <div className="sticky top-0 z-[1400]">
            <ServiceAvailabilityTicker />
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
                          ? `https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Transparent_${resolvedTheme === "dark" ? "Dark" : "Light"}.webp`
                          : "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent.webp"
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
                {isMobile && (
                  <Box className="flex items-center gap-1">
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
                        <IconButton
                          className="text-tertiary-text hover:bg-quaternary-bg transition-colors duration-200"
                          aria-label="Support us"
                        >
                          <Image
                            src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.svg"
                            alt="Ko-fi"
                            width={22}
                            height={22}
                            style={{ display: "block" }}
                          />
                        </IconButton>
                      </Link>
                    </Tooltip>
                    <AnimatedThemeToggler />
                    <div className="w-8 h-8" /> {/* Spacer for layout */}
                  </Box>
                )}
              </Toolbar>
            </AppBar>
          </div>

          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            anchor="right"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            slotProps={{
              paper: {
                sx: {
                  backdropFilter: "blur(12px)",
                  backgroundImage: "none",
                  color: "var(--color-primary-text)",
                  borderLeft: "1px solid var(--color-border-primary)",
                  width: "15rem",
                  boxSizing: "border-box",
                  boxShadow: "none",
                  zIndex: 1450,
                },
              },
            }}
            sx={{
              zIndex: 1450,
            }}
            className="[&_.MuiDrawer-paper]:bg-primary-bg/75 [&_.MuiDrawer-paper]:border-border-primary [&_.MuiDrawer-paper]:text-primary-text [&_.MuiDrawer-paper]:supports-[backdrop-filter]:bg-primary-bg/75 [&_.MuiDrawer-paper]:box-border [&_.MuiDrawer-paper]:w-60 [&_.MuiDrawer-paper]:border-l [&_.MuiDrawer-paper]:backdrop-blur-lg"
          >
            {drawer}
          </Drawer>
        </>
      )}

      <LoginModalWrapper
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <EscapeLoginModal />
    </>
  );
}
