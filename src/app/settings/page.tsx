"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserData } from "@/types/auth";
import {
  Container,
  Typography,
  Box,
  FormGroup,
  Paper,
  Divider,
  Button,
  Skeleton,
  Grid,
} from "@mui/material";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { settingsConfig, SettingKey } from "@/config/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingToggle } from "@/components/Settings/SettingToggle";
import { BannerSettings } from "@/components/Settings/BannerSettings";
import { AvatarSettings } from "@/components/Settings/AvatarSettings";
import { Icon } from "@/components/ui/IconWrapper";
import { Button as CustomButton } from "@/components/ui/button";
import { DeleteAccount } from "@/components/Settings/DeleteAccount";
import { RobloxConnection } from "@/components/Settings/RobloxConnection";
import { ExportInventoryData } from "@/components/Settings/ExportInventoryData";
import { useAuthContext } from "@/contexts/AuthContext";
import SupporterModal from "@/components/Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { safeSetJSON } from "@/utils/safeStorage";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { toast } from "sonner";
import { NotificationPreferenceToggle } from "@/components/Settings/NotificationPreferenceToggle";
import {
  fetchAvailableNotificationPreferences,
  fetchUserNotificationPreferences,
  updateUserNotificationPreferences,
  type NotificationPreferenceEntry,
} from "@/services/notificationPreferencesService";
import { EmailNotificationSettings } from "@/components/Settings/EmailNotificationSettings";

export default function SettingsPage() {
  const { user, isLoading } = useAuthContext();
  const { modalState, closeModal, openModal } = useSupporterModal();
  const router = useRouter();
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightSetting, setHighlightSetting] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<
    NotificationPreferenceEntry[] | null
  >(null);
  const [notificationPrefsLoading, setNotificationPrefsLoading] =
    useState<boolean>(true);
  const [notificationPrefsSaving, setNotificationPrefsSaving] = useState<
    Record<string, boolean>
  >({});
  const [notificationPrefsError, setNotificationPrefsError] = useState<
    string | null
  >(null);

  // Derive state from props instead of setting in useEffect
  const userData = user;
  const loading = isLoading;

  useEffect(() => {
    // Check for highlight parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const highlight = urlParams.get("highlight");

    if (highlight) {
      // Use setTimeout to defer state updates
      const timer = setTimeout(() => {
        setHighlightSetting(highlight);
        setShowHighlight(true);

        // Clear highlight after 10 seconds
        const clearTimer = setTimeout(() => {
          setShowHighlight(false);
          setHighlightSetting(null);
          // Remove the highlight parameter from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }, 10000);

        return () => clearTimeout(clearTimer);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, []);

  const {
    settings,
    loading: settingsLoading,
    handleSettingChange,
  } = useSettings(userData, openModal);

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not authenticated and auth is not loading
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    let mounted = true;
    async function loadNotificationPrefs() {
      setNotificationPrefsLoading(true);
      setNotificationPrefsError(null);

      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (attempts < MAX_ATTEMPTS) {
        try {
          // These hit Next.js API routes (server-side calls upstream)
          const [available, userPrefs] = await Promise.all([
            fetchAvailableNotificationPreferences(),
            fetchUserNotificationPreferences(),
          ]);

          const explicitMap = new Map(
            (userPrefs.preferences ?? []).map((p) => [p.title, !!p.enabled]),
          );

          // Missing preference = ON by default
          const merged: NotificationPreferenceEntry[] = available.map(
            (title) => ({
              title,
              enabled: explicitMap.has(title)
                ? (explicitMap.get(title) as boolean)
                : true,
            }),
          );

          if (mounted) {
            setNotificationPrefs(merged);
            setNotificationPrefsError(null);
          }
          break; // Success!
        } catch (e) {
          attempts++;
          if (attempts >= MAX_ATTEMPTS || !mounted) {
            if (mounted) {
              setNotificationPrefs([]);
              setNotificationPrefsError(
                e instanceof Error
                  ? e.message
                  : "Failed to load notification preferences",
              );
            }
            break;
          }

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempts - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (mounted) setNotificationPrefsLoading(false);
    }

    // Only attempt when auth is resolved and user is present
    if (!isLoading && user) loadNotificationPrefs();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user?.id]);

  const setSaving = (title: string, saving: boolean) => {
    setNotificationPrefsSaving((prev) => ({ ...prev, [title]: saving }));
  };

  const handleNotificationPrefToggle = async (
    title: string,
    nextEnabled: boolean,
  ) => {
    if (!notificationPrefs) return;

    // Optimistic UI update
    const prev = notificationPrefs;
    const next = prev.map((p) =>
      p.title === title ? { ...p, enabled: nextEnabled } : p,
    );
    setNotificationPrefs(next);
    setNotificationPrefsError(null);
    setSaving(title, true);

    const humanizedTitle = title
      .split("_")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    try {
      await updateUserNotificationPreferences([
        { title, enabled: nextEnabled },
      ]);
      toast.success("Setting Updated", {
        description: `Notification preference for "${humanizedTitle}" has been ${nextEnabled ? "enabled" : "disabled"}.`,
      });

      window.umami?.track("Update Notification Preference", {
        preference: title,
        enabled: nextEnabled,
      });
    } catch (e) {
      // Revert on failure
      setNotificationPrefs(prev);
      const msg =
        e instanceof Error ? e.message : "Failed to update preference";
      setNotificationPrefsError(msg);
      toast.error(msg);
    } finally {
      setSaving(title, false);
    }
  };

  const handleBannerUpdate = (newBannerUrl: string) => {
    if (userData) {
      const updatedUser: UserData = {
        ...userData,
        custom_banner: newBannerUrl,
        settings: {
          ...userData.settings,
          banner_discord: 0, // Set to use custom banner
        },
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (userData) {
      const updatedUser: UserData = {
        ...userData,
        custom_avatar: newAvatarUrl,
        settings: {
          ...userData.settings,
          avatar_discord: 0, // Set to use custom avatar
        },
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );
    }
  };

  if (loading || settingsLoading) {
    return (
      <Container maxWidth="lg" sx={{ minHeight: "100vh", py: 4 }}>
        <Grid container spacing={4}>
          {/* Sidebar Skeleton */}
          <Grid
            size={{ xs: 12, lg: 3 }}
            sx={{
              display: { xs: "none", lg: "block" },
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor: "var(--color-secondary-bg)",
                backgroundImage: "none",
                border: "1px solid var(--color-border-card)",
              }}
            >
              <Skeleton
                variant="text"
                width="60%"
                height={32}
                sx={{ mb: 2, mx: 2 }}
              />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Box key={i} sx={{ px: 2, py: 1.5 }}>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={36}
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Content Skeleton */}
          <Grid size={{ xs: 12, lg: 9 }}>
            {[1, 2, 3].map((i) => (
              <Paper
                key={i}
                elevation={1}
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: "var(--color-secondary-bg)",
                  borderRadius: 3,
                  backgroundImage: "none",
                  border: "1px solid var(--color-border-card)",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
                >
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="text" width="40%" height={40} />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[1, 2, 3].map((j) => (
                    <Box key={j}>
                      <Skeleton
                        variant="text"
                        width="30%"
                        height={28}
                        sx={{ mb: 1 }}
                      />
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={20}
                        sx={{ mb: 2 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={44}
                        height={24}
                        sx={{ borderRadius: 10 }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!userData || !settings) {
    return null;
  }

  const settingsByCategory: Record<string, string[]> = {};
  Object.keys(settings)
    .filter((key) => key !== "updated_at" && key in settingsConfig)
    .forEach((key) => {
      const config = settingsConfig[key as SettingKey];
      if (config && config.category !== "System") {
        const { category } = config;
        if (!settingsByCategory[category]) {
          settingsByCategory[category] = [];
        }
        settingsByCategory[category].push(key);
      }
    });

  // Sort settings within categories
  const LINKED_ORDER: Record<string, string[]> = {
    Privacy: [
      "dms_allowed",
      "hide_presence",
      "hide_favorites",
      "hide_followers",
      "hide_following",
      "profile_public",
      "show_recent_comments",
    ],
    Appearance: ["avatar_discord", "banner_discord"],
  };

  Object.keys(settingsByCategory).forEach((category) => {
    if (LINKED_ORDER[category]) {
      settingsByCategory[category].sort((a, b) => {
        const indexA = LINKED_ORDER[category].indexOf(a);
        const indexB = LINKED_ORDER[category].indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    }
  });

  return (
    <Container maxWidth="lg" sx={{ minHeight: "100vh", py: 4 }}>
      <Box sx={{ mt: -2, mb: 0 }}>
        <Breadcrumb />
      </Box>
      <Grid container spacing={4} sx={{ mt: 2 }} alignItems="flex-start">
        {/* Sidebar Navigation */}
        <Grid
          size={{ xs: 12, lg: 3 }}
          sx={{
            display: { xs: "none", lg: "block" },
            position: "sticky",
            top: "100px",
            height: "fit-content",
          }}
        >
          <Paper
            elevation={1}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              backgroundColor: "var(--color-secondary-bg)",
              p: 2,
              borderRadius: 3,
              backgroundImage: "none",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <Typography
              variant="overline"
              sx={{
                px: 2,
                mb: 1,
                color: "var(--color-primary-text)",
                fontWeight: "bold",
                letterSpacing: "0.1em",
              }}
            >
              Navigation
            </Typography>
            {[
              ...Object.keys(settingsByCategory).map((cat) => ({
                id: cat.replace(/\s+/g, "_").toLowerCase(),
                title: cat,
                icon:
                  cat === "Privacy"
                    ? "heroicons:lock-closed"
                    : "heroicons:sparkles",
              })),
              {
                id: "notifications",
                title: "Notification Preferences",
                icon: "heroicons:bell",
              },
              {
                id: "connections",
                title: "Account Connections",
                icon: "heroicons:link",
              },
              {
                id: "export",
                title: "Export Data",
                icon: "heroicons:arrow-down-tray",
              },
              {
                id: "danger",
                title: "Danger Zone",
                icon: "heroicons:exclamation-triangle",
              },
            ].map((section) => (
              <Button
                key={section.id}
                onClick={() => {
                  const el = document.getElementById(section.id);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                sx={{
                  justifyContent: "flex-start",
                  color: "var(--color-primary-text)",
                  textTransform: "none",
                  fontWeight: 500,
                  py: 1,
                  px: 2,
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: "var(--color-quaternary-bg)",
                    color: "var(--color-primary-text)",
                  },
                }}
                startIcon={<Icon icon={section.icon} className="h-5 w-5" />}
              >
                {section.title}
              </Button>
            ))}
          </Paper>
        </Grid>

        {/* Settings Content */}
        <Grid size={{ xs: 12, lg: 9 }}>
          {Object.entries(settingsByCategory).map(([category, settingKeys]) => {
            return (
              <Paper
                key={category}
                id={category.replace(/\s+/g, "_").toLowerCase()}
                elevation={1}
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  borderRadius: 3,
                  backgroundImage: "none",
                  border: "1px solid var(--color-border-card)",
                  ...(highlightSetting ===
                    category.replace(/\s+/g, "_").toLowerCase() && showHighlight
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                        transition: "background-color 0.5s ease",
                      }
                    : {}),
                }}
                ref={(el) => {
                  if (
                    highlightSetting ===
                      category.replace(/\s+/g, "_").toLowerCase() &&
                    showHighlight &&
                    el
                  ) {
                    setTimeout(() => {
                      (el as HTMLElement).scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 100);
                  }
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontWeight: "bold",
                    color: "var(--color-primary-text)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Icon
                    icon={
                      category === "Privacy"
                        ? "heroicons:lock-closed"
                        : "heroicons:sparkles"
                    }
                    className="h-6 w-6"
                  />
                  {category}
                  {userData?.flags?.some((f) => f.flag === "is_owner") && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            const highlightVal = category
                              .replace(/\s+/g, "_")
                              .toLowerCase();
                            url.searchParams.set("highlight", highlightVal);
                            navigator.clipboard.writeText(url.toString());
                            toast.success("Link Copied", {
                              description: `The URL for the "${category}" section is now on your clipboard.`,
                            });
                          }}
                          className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                          aria-label="Copy category link"
                        >
                          <Icon icon="heroicons:link" className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-secondary-bg text-primary-text border-none shadow-[var(--color-card-shadow)]"
                      >
                        <p>Copy URL</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <FormGroup>
                  {settingKeys.map((key) => {
                    const typedKey = key as keyof typeof settings;
                    const isHighlighted =
                      highlightSetting === key && showHighlight;
                    return (
                      <Box
                        key={key}
                        sx={{
                          ...(isHighlighted
                            ? {
                                backgroundColor:
                                  "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                                transition: "background-color 0.5s ease",
                              }
                            : {}),
                        }}
                        ref={(el) => {
                          if (isHighlighted && el) {
                            // Scroll the highlighted setting into view after a short delay
                            setTimeout(() => {
                              (el as HTMLElement).scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }, 100);
                          }
                        }}
                      >
                        <SettingToggle
                          name={typedKey}
                          value={settings[typedKey]}
                          config={settingsConfig[key as SettingKey]}
                          onChange={handleSettingChange}
                          disabled={false}
                          userData={userData}
                        />
                        {category === "Appearance" &&
                          key === "banner_discord" &&
                          settings[typedKey] === 0 && (
                            <BannerSettings
                              userData={userData}
                              onBannerUpdate={handleBannerUpdate}
                            />
                          )}
                        {category === "Appearance" &&
                          key === "avatar_discord" &&
                          settings[typedKey] === 0 && (
                            <AvatarSettings
                              userData={userData}
                              onAvatarUpdate={handleAvatarUpdate}
                            />
                          )}
                      </Box>
                    );
                  })}
                </FormGroup>
                {category === "Appearance" &&
                  (settings.banner_discord === 0 ||
                    settings.avatar_discord === 0) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                        <CustomButton
                          variant="default"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://imgbb.com/",
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <Icon
                            icon="akar-icons:link-out"
                            className="h-4 w-4"
                          />
                          ImgBB
                        </CustomButton>
                        <CustomButton
                          variant="default"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://postimages.org/",
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <Icon
                            icon="akar-icons:link-out"
                            className="h-4 w-4"
                          />
                          PostImages
                        </CustomButton>
                        <CustomButton
                          variant="default"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://tenor.com/",
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <Icon
                            icon="akar-icons:link-out"
                            className="h-4 w-4"
                          />
                          Tenor
                        </CustomButton>
                        <CustomButton
                          variant="default"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://imgur.com/",
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <Icon
                            icon="akar-icons:link-out"
                            className="h-4 w-4"
                          />
                          Imgur
                        </CustomButton>
                        <CustomButton
                          variant="default"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://vgy.me/",
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <Icon
                            icon="akar-icons:link-out"
                            className="h-4 w-4"
                          />
                          vgy.me
                        </CustomButton>
                      </Box>
                    </>
                  )}
              </Paper>
            );
          })}

          <Paper
            id="notifications"
            elevation={1}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              borderRadius: 3,
              backgroundImage: "none",
              border: "1px solid var(--color-border-card)",
              ...(highlightSetting === "notifications" && showHighlight
                ? {
                    backgroundColor:
                      "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                    transition: "background-color 0.5s ease",
                  }
                : {}),
            }}
            ref={(el) => {
              if (highlightSetting === "notifications" && showHighlight && el) {
                // Scroll the highlighted section into view after a short delay
                setTimeout(() => {
                  (el as HTMLElement).scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 100);
              }
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "var(--color-primary-text)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Icon icon="heroicons:bell" className="h-6 w-6" />
              Notification Preferences
              {userData?.flags?.some((f) => f.flag === "is_owner") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("highlight", "notifications");
                        navigator.clipboard.writeText(url.toString());
                        toast.success(
                          'Link for "Notification Preferences" copied!',
                        );
                      }}
                      className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                      aria-label="Copy section link"
                    >
                      <Icon icon="heroicons:link" className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-[var(--color-card-shadow)]"
                  >
                    <p>Copy URL</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <EmailNotificationSettings userData={userData} />
            <Divider sx={{ mb: 2, opacity: 0.5 }} />

            {notificationPrefsError && (
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color:
                    notificationPrefsError === "Authentication required"
                      ? "var(--color-primary-text)"
                      : "var(--color-button-danger)",
                }}
              >
                {notificationPrefsError === "Authentication required"
                  ? "Try refresh the page"
                  : notificationPrefsError}
              </Typography>
            )}

            {notificationPrefsLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <Skeleton variant="rectangular" width={40} height={24} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton
                        variant="text"
                        width="60%"
                        height={24}
                        sx={{ mb: 1 }}
                      />
                      <Skeleton variant="text" width="80%" height={20} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <FormGroup>
                {(notificationPrefs ?? []).map((pref) => {
                  const isHighlighted =
                    highlightSetting === pref.title && showHighlight;
                  return (
                    <Box
                      key={pref.title}
                      sx={{
                        ...(isHighlighted
                          ? {
                              backgroundColor:
                                "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                              transition: "background-color 0.5s ease",
                            }
                          : {}),
                      }}
                      ref={(el) => {
                        if (isHighlighted && el) {
                          setTimeout(() => {
                            (el as HTMLElement).scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, 100);
                        }
                      }}
                    >
                      <NotificationPreferenceToggle
                        title={pref.title}
                        enabled={pref.enabled}
                        disabled={!!notificationPrefsSaving[pref.title]}
                        onChange={(nextEnabled) =>
                          handleNotificationPrefToggle(pref.title, nextEnabled)
                        }
                        description="Toggle whether you receive this notification"
                        userData={userData}
                      />
                    </Box>
                  );
                })}
              </FormGroup>
            )}
          </Paper>

          <Paper
            id="connections"
            elevation={1}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              borderRadius: 3,
              backgroundImage: "none",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "var(--color-primary-text)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Icon icon="heroicons:link" className="h-6 w-6" />
              Account Connections
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <RobloxConnection userData={userData} />
          </Paper>

          <Paper
            id="export"
            elevation={1}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              borderRadius: 3,
              backgroundImage: "none",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "var(--color-primary-text)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Icon icon="heroicons:arrow-down-tray" className="h-6 w-6" />
              Export Data
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ExportInventoryData />
          </Paper>

          <Paper
            id="danger"
            elevation={1}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              border: "1px solid var(--color-border-card)",
              borderRadius: 3,
              backgroundImage: "none",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "var(--color-button-danger)",
                borderRadius: "2px 2px 0 0",
              },
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "var(--color-button-danger)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Icon
                icon="heroicons:exclamation-triangle"
                className="h-6 w-6"
                style={{ color: "var(--color-button-danger)" }}
              />
              Danger Zone
            </Typography>
            <Divider
              sx={{
                mb: 2,
                bgcolor: "var(--color-button-danger)",
                opacity: 0.3,
              }}
            />
            <DeleteAccount />
          </Paper>

          {/* Supporter Modal */}
          <SupporterModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            feature={modalState.feature}
            currentTier={modalState.currentTier}
            requiredTier={modalState.requiredTier}
            currentLimit={modalState.currentLimit}
            requiredLimit={modalState.requiredLimit}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
