"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserData } from "@/types/auth";
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
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  // Derive state from props instead of setting in useEffect
  const userData = user;
  const loading = isLoading;
  const cardClassName =
    "border-border-card bg-secondary-bg rounded-xl border shadow-md";

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
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="settings-loading-layout">
          {/* Sidebar Skeleton */}
          <div className="settings-loading-sidebar">
            <div className={`${cardClassName} p-4`}>
              <div className="bg-tertiary-bg mx-2 mb-2 h-8 w-3/5 animate-pulse rounded-md" />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="px-2 py-1.5">
                  <div className="bg-tertiary-bg h-9 w-full animate-pulse rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="settings-loading-content">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${cardClassName} mb-8 p-6`}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="bg-tertiary-bg h-8 w-8 animate-pulse rounded-full" />
                  <div className="bg-tertiary-bg h-10 w-2/5 animate-pulse rounded-md" />
                </div>

                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <div className="bg-tertiary-bg mb-1 h-7 w-[30%] animate-pulse rounded-md" />
                      <div className="bg-tertiary-bg mb-2 h-5 w-[80%] animate-pulse rounded-md" />
                      <div className="bg-tertiary-bg h-6 w-11 animate-pulse rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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

  const categoryOrder = ["Appearance", "Privacy"];
  const orderedCategories = Object.keys(settingsByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const isSettingEnabled = (value: unknown) =>
    value === 1 || value === "1" || value === true;

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="-mt-2 mb-0">
        <Breadcrumb />
      </div>
      <div className="settings-layout mt-4">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <div className={`${cardClassName} flex flex-col gap-0.5 p-4`}>
            <p className="text-primary-text mb-1 px-2 text-xs font-bold tracking-[0.1em] uppercase">
              Navigation
            </p>
            {[
              ...orderedCategories.map((cat) => ({
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
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(section.id);
                  el?.scrollIntoView({
                    behavior: "smooth",
                    block: section.id === "notifications" ? "start" : "center",
                  });
                }}
                className="text-primary-text hover:bg-quaternary-bg hover:text-primary-text w-full cursor-pointer rounded-md px-2 py-2 text-left text-sm font-medium transition-colors"
              >
                <span className="flex items-center">
                  <Icon icon={section.icon} className="mr-2 h-5 w-5 shrink-0" />
                  {section.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {orderedCategories.map((category) => {
            const settingKeys = settingsByCategory[category];
            return (
              <div
                key={category}
                id={category.replace(/\s+/g, "_").toLowerCase()}
                className={`${cardClassName} text-primary-text mb-8 p-6`}
                style={
                  highlightSetting ===
                    category.replace(/\s+/g, "_").toLowerCase() && showHighlight
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                        transition: "background-color 0.5s ease",
                      }
                    : undefined
                }
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
                <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
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
                </h2>
                <div className="border-border-card mb-2 border-t" />
                <div>
                  {settingKeys.map((key) => {
                    const typedKey = key as keyof typeof settings;
                    const isHighlighted =
                      highlightSetting === key && showHighlight;
                    const isAppearanceToggle =
                      key === "avatar_discord" || key === "banner_discord";
                    const isAppearanceUploadBusy =
                      isAvatarUploading || isBannerUploading;
                    return (
                      <div
                        key={key}
                        style={
                          isHighlighted
                            ? {
                                backgroundColor:
                                  "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                                transition: "background-color 0.5s ease",
                              }
                            : undefined
                        }
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
                          disabled={
                            isAppearanceToggle && isAppearanceUploadBusy
                          }
                          userData={userData}
                        />
                        {category === "Appearance" &&
                          key === "banner_discord" &&
                          !isSettingEnabled(settings[typedKey]) && (
                            <BannerSettings
                              userData={userData}
                              onBannerUpdate={handleBannerUpdate}
                              onUploadStateChange={setIsBannerUploading}
                            />
                          )}
                        {category === "Appearance" &&
                          key === "avatar_discord" &&
                          !isSettingEnabled(settings[typedKey]) && (
                            <AvatarSettings
                              userData={userData}
                              onAvatarUpdate={handleAvatarUpdate}
                              onUploadStateChange={setIsAvatarUploading}
                            />
                          )}
                      </div>
                    );
                  })}
                </div>
                {category === "Appearance" &&
                  (!isSettingEnabled(settings.banner_discord) ||
                    !isSettingEnabled(settings.avatar_discord)) && (
                    <>
                      <div className="border-border-card my-2 border-t" />
                      <div className="flex flex-wrap gap-1.5">
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
                      </div>
                    </>
                  )}
              </div>
            );
          })}

          <div
            id="notifications"
            className={`${cardClassName} text-primary-text mb-8 scroll-mt-24 p-6`}
            style={
              highlightSetting === "notifications" && showHighlight
                ? {
                    backgroundColor:
                      "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                    transition: "background-color 0.5s ease",
                  }
                : undefined
            }
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
            <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
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
            </h2>
            <div className="border-border-card mb-2 border-t" />

            <EmailNotificationSettings userData={userData} />
            <div className="border-border-card mb-2 border-t opacity-50" />

            {notificationPrefsError && (
              <p
                className={`mb-2 text-sm ${
                  notificationPrefsError === "Authentication required"
                    ? "text-primary-text"
                    : "text-button-danger"
                }`}
              >
                {notificationPrefsError === "Authentication required"
                  ? "Try refresh the page"
                  : notificationPrefsError}
              </p>
            )}

            {notificationPrefsLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="bg-tertiary-bg h-6 w-10 animate-pulse rounded-md" />
                    <div className="flex-1">
                      <div className="bg-tertiary-bg mb-1 h-6 w-[60%] animate-pulse rounded-md" />
                      <div className="bg-tertiary-bg h-5 w-[80%] animate-pulse rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {(notificationPrefs ?? []).map((pref) => {
                  const isHighlighted =
                    highlightSetting === pref.title && showHighlight;
                  return (
                    <div
                      key={pref.title}
                      style={
                        isHighlighted
                          ? {
                              backgroundColor:
                                "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                              transition: "background-color 0.5s ease",
                            }
                          : undefined
                      }
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            id="connections"
            className={`${cardClassName} text-primary-text mb-8 p-6`}
          >
            <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
              <Icon icon="heroicons:link" className="h-6 w-6" />
              Account Connections
            </h2>
            <div className="border-border-card mb-2 border-t" />
            <RobloxConnection userData={userData} />
          </div>

          <div
            id="export"
            className={`${cardClassName} text-primary-text mb-8 p-6`}
          >
            <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
              <Icon icon="heroicons:arrow-down-tray" className="h-6 w-6" />
              Export Data
            </h2>
            <div className="border-border-card mb-2 border-t" />
            <ExportInventoryData />
          </div>

          <div
            id="danger"
            className={`${cardClassName} text-primary-text relative mb-8 p-6`}
          >
            <div className="bg-button-danger absolute top-0 right-0 left-0 h-1 rounded-t-xl" />
            <h2 className="text-button-danger mb-2 flex items-center gap-1.5 text-xl font-bold">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="h-6 w-6"
                style={{ color: "var(--color-button-danger)" }}
              />
              Danger Zone
            </h2>
            <div
              className="mb-2 border-t"
              style={{
                borderColor: "var(--color-button-danger)",
                opacity: 0.3,
              }}
            />
            <DeleteAccount />
          </div>

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
        </div>
      </div>
      <style jsx>{`
        .settings-layout,
        .settings-loading-layout {
          display: block;
        }

        .settings-sidebar,
        .settings-loading-sidebar {
          display: none;
        }

        .settings-content,
        .settings-loading-content {
          width: 100%;
        }

        @media (min-width: 1200px) {
          .settings-layout,
          .settings-loading-layout {
            display: grid;
            grid-template-columns: minmax(0, 3fr) minmax(0, 9fr);
            gap: 2rem;
            align-items: start;
          }

          .settings-sidebar,
          .settings-loading-sidebar {
            display: block;
            position: sticky;
            top: 100px;
            height: fit-content;
          }
        }
      `}</style>
    </div>
  );
}
