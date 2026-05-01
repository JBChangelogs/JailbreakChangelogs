"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  SupporterGift,
  SupporterLevel,
  UserData,
  UserSettingsV2,
} from "@/types/auth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSettingName } from "@/config/settings";
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
import { DesktopNotificationToggle } from "@/components/Settings/DesktopNotificationToggle";
import {
  fetchAvailableNotificationPreferences,
  fetchUserNotificationPreferences,
  updateUserNotificationPreferences,
  type NotificationPreferenceEntry,
} from "@/services/notificationPreferencesService";
import { EmailNotificationSettings } from "@/components/Settings/EmailNotificationSettings";
import {
  fetchSupporterGiftLevels,
  giftSupporterGift,
} from "@/services/settingsService";
import { searchUsers } from "@/utils/api";
import { UserAvatar } from "@/utils/avatar";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";
const supporterIcons: Record<number, string> = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

export default function SettingsPage() {
  const { user, isLoading } = useAuthContext();
  const { modalState, closeModal, openModal } = useSupporterModal();
  const router = useRouter();
  const [highlightParam, setHighlightParam] = useQueryState("highlight", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
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
    if (!highlightParam) return;

    const timer = window.setTimeout(() => {
      setHighlightSetting(highlightParam);
      setShowHighlight(true);
    }, 0);

    const clearTimer = window.setTimeout(() => {
      setShowHighlight(false);
      setHighlightSetting(null);
      void setHighlightParam(null);
    }, 10000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightParam, setHighlightParam]);

  const {
    settings,
    supporterGifts,
    setSupporterGifts,
    loading: settingsLoading,
    handleSettingChange,
  } = useSettings(userData, openModal);
  const [giftingIds, setGiftingIds] = useState<Record<string, boolean>>({});
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftModalStep, setGiftModalStep] = useState<"search" | "confirm">(
    "search",
  );
  const [activeGift, setActiveGift] = useState<SupporterGift | null>(null);
  const [giftSearchQuery, setGiftSearchQuery] = useState("");
  const [giftSearchResults, setGiftSearchResults] = useState<UserData[]>([]);
  const [giftSearchLoading, setGiftSearchLoading] = useState(false);
  const [selectedGiftRecipient, setSelectedGiftRecipient] =
    useState<UserData | null>(null);
  const [purchaseGiftModalOpen, setPurchaseGiftModalOpen] = useState(false);
  const [purchaseGiftLevels, setPurchaseGiftLevels] = useState<
    SupporterLevel[]
  >([]);
  const [purchaseGiftLevelsLoading, setPurchaseGiftLevelsLoading] =
    useState(false);
  const [purchaseGiftLevelsError, setPurchaseGiftLevelsError] = useState<
    string | null
  >(null);
  const [purchaseGiftTab, setPurchaseGiftTab] = useState<"self" | "gift">(
    "gift",
  );
  const giftSearchTimeoutRef = useRef<number | null>(null);
  const giftSearchRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (giftSearchTimeoutRef.current) {
        window.clearTimeout(giftSearchTimeoutRef.current);
      }
    };
  }, []);

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
            fetchUserNotificationPreferences(user!.id),
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps
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
        settings_v2: {
          ...userData.settings_v2,
          custom_banner: true,
        } as UserSettingsV2,
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
        settings_v2: {
          ...userData.settings_v2,
          custom_avatar: true,
        } as UserSettingsV2,
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );
    }
  };

  useEffect(() => {
    const trimmedQuery = giftSearchQuery.trim();
    if (!giftModalOpen || !activeGift || !trimmedQuery) {
      giftSearchRequestIdRef.current += 1;
      setGiftSearchResults([]);
      setGiftSearchLoading(false);
      return;
    }

    const requestId = (giftSearchRequestIdRef.current += 1);
    setGiftSearchLoading(true);

    if (giftSearchTimeoutRef.current) {
      window.clearTimeout(giftSearchTimeoutRef.current);
    }

    giftSearchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const resultsRaw = await searchUsers(trimmedQuery, 5);
        if (giftSearchRequestIdRef.current !== requestId) return;

        const results = Array.isArray(resultsRaw)
          ? resultsRaw.filter((result) => result?.id !== user?.id)
          : [];
        setGiftSearchResults(results);
      } catch (error) {
        if (giftSearchRequestIdRef.current !== requestId) return;
        console.error("Error searching gift recipients:", error);
        setGiftSearchResults([]);
      } finally {
        if (giftSearchRequestIdRef.current === requestId) {
          setGiftSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      if (giftSearchTimeoutRef.current) {
        window.clearTimeout(giftSearchTimeoutRef.current);
      }
    };
  }, [activeGift, giftModalOpen, giftSearchQuery, user?.id]);

  useEffect(() => {
    if (!purchaseGiftModalOpen) return;
    if (purchaseGiftLevels.length > 0) return;

    let mounted = true;
    setPurchaseGiftLevelsLoading(true);
    setPurchaseGiftLevelsError(null);

    fetchSupporterGiftLevels()
      .then((levels) => {
        if (!mounted) return;
        const sortedLevels = [...levels].sort((a, b) => a.level - b.level);
        setPurchaseGiftLevels(sortedLevels);
      })
      .catch((error) => {
        if (!mounted) return;
        setPurchaseGiftLevelsError(
          error instanceof Error
            ? error.message
            : "Failed to fetch supporter levels",
        );
      })
      .finally(() => {
        if (mounted) {
          setPurchaseGiftLevelsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [purchaseGiftLevels.length, purchaseGiftModalOpen]);

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

  const sortedCategories = Object.values(settings).sort(
    (a, b) => a.index - b.index,
  );

  const settingsMap = Object.fromEntries(
    Object.values(settings).flatMap((cat) =>
      cat.settings.map((s) => [s.name, s]),
    ),
  );

  const isSettingEnabled = (name: string) => settingsMap[name]?.value === true;
  const sortedSupporterGifts = [...supporterGifts].sort((a, b) => {
    if (a.level !== b.level) return b.level - a.level;
    return b.created_at - a.created_at;
  });
  const getSupporterGiftTierLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Supporter One Gift";
      case 2:
        return "Supporter Two Gift";
      case 3:
        return "Supporter Three Gift";
      default:
        return `Supporter Gift ${level}`;
    }
  };
  const openPurchaseGiftModal = () => {
    setPurchaseGiftTab("gift");
    setPurchaseGiftModalOpen(true);
  };
  const closePurchaseGiftModal = () => {
    setPurchaseGiftModalOpen(false);
  };
  const sortedPurchaseLevels = [...purchaseGiftLevels].sort(
    (a, b) => a.level - b.level,
  );
  const selfPurchaseLevels = sortedPurchaseLevels.filter(
    (level) => !level.is_gift,
  );
  const giftPurchaseLevels = sortedPurchaseLevels.filter(
    (level) => level.is_gift,
  );
  const closeGiftModal = () => {
    setGiftModalOpen(false);
    setGiftModalStep("search");
    setActiveGift(null);
    setGiftSearchQuery("");
    setGiftSearchResults([]);
    setGiftSearchLoading(false);
    setSelectedGiftRecipient(null);
  };
  const handleGiftModalDismiss = () => {
    if (giftModalStep === "confirm") {
      setGiftModalStep("search");
      return;
    }
    closeGiftModal();
  };
  const openGiftModalForGift = (gift: SupporterGift) => {
    setActiveGift(gift);
    setGiftModalOpen(true);
    setGiftModalStep("search");
    setGiftSearchQuery("");
    setGiftSearchResults([]);
    setGiftSearchLoading(false);
    setSelectedGiftRecipient(null);
  };
  const handleGiftSubmit = async () => {
    if (!activeGift || !selectedGiftRecipient?.id) {
      toast.error("Select a user from search results first.");
      return;
    }

    setGiftingIds((prev) => ({ ...prev, [activeGift.share_id]: true }));
    try {
      await giftSupporterGift(activeGift.share_id, selectedGiftRecipient.id);
      setSupporterGifts((prev) =>
        prev.filter((gift) => gift.share_id !== activeGift.share_id),
      );
      toast.success("Gift sent successfully.");
      closeGiftModal();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to gift purchase",
      );
    } finally {
      setGiftingIds((prev) => ({ ...prev, [activeGift.share_id]: false }));
    }
  };
  const handleRedeemForSelf = async (shareId: string) => {
    if (!userData?.id) {
      toast.error("You must be logged in to redeem this gift.");
      return;
    }

    setGiftingIds((prev) => ({ ...prev, [shareId]: true }));
    try {
      await giftSupporterGift(shareId, userData.id);
      setSupporterGifts((prev) =>
        prev.filter((gift) => gift.share_id !== shareId),
      );
      if (activeGift?.share_id === shareId) {
        closeGiftModal();
      }
      toast.success("Gift redeemed successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to redeem gift",
      );
    } finally {
      setGiftingIds((prev) => ({ ...prev, [shareId]: false }));
    }
  };
  const copySectionLink = (sectionId: string, sectionTitle: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("highlight", sectionId);
    void setHighlightParam(sectionId);
    navigator.clipboard.writeText(url.toString());
    toast.success("Link Copied", {
      description: `The URL for the "${sectionTitle}" section is now on your clipboard.`,
    });
  };
  const getSectionHighlightStyle = (sectionId: string) =>
    highlightSetting === sectionId && showHighlight
      ? {
          backgroundColor:
            "color-mix(in srgb, var(--color-button-info), transparent 80%)",
          transition: "background-color 0.5s ease",
        }
      : undefined;
  const scrollHighlightedSectionIntoView = (
    sectionId: string,
    el: HTMLElement | null,
  ) => {
    if (highlightSetting === sectionId && showHighlight && el) {
      setTimeout(() => {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  };

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
              ...sortedCategories.map((cat) => ({
                id: cat.name,
                title: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
                icon:
                  cat.name === "privacy"
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
                id: "gifts",
                title: "Purchased Gifts",
                icon: "heroicons:gift",
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
          {sortedCategories.map((cat) => {
            const categoryDisplayName =
              cat.name.charAt(0).toUpperCase() + cat.name.slice(1);
            const sortedSettings = [...cat.settings].sort(
              (a, b) => a.index - b.index,
            );
            const isAppearanceCat = cat.name === "appearance";
            return (
              <div
                key={cat.name}
                id={cat.name}
                className={`${cardClassName} text-primary-text mb-8 p-6`}
                style={
                  highlightSetting === cat.name && showHighlight
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                        transition: "background-color 0.5s ease",
                      }
                    : undefined
                }
                ref={(el) => {
                  if (highlightSetting === cat.name && showHighlight && el) {
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
                      cat.name === "privacy"
                        ? "heroicons:lock-closed"
                        : "heroicons:sparkles"
                    }
                    className="h-6 w-6"
                  />
                  {categoryDisplayName}
                  {userData?.flags?.some((f) => f.flag === "is_owner") && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            copySectionLink(cat.name, categoryDisplayName)
                          }
                          className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                          aria-label="Copy category link"
                        >
                          <Icon icon="heroicons:link" className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                      >
                        <p>Copy URL</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </h2>
                <p className="text-secondary-text mb-2 text-sm">
                  {cat.description}
                </p>
                <div className="border-border-card mb-2 border-t" />
                <div>
                  {sortedSettings.map((entry) => {
                    const isHighlighted =
                      highlightSetting === entry.name && showHighlight;
                    const isAppearanceUploadBusy =
                      isAvatarUploading || isBannerUploading;
                    return (
                      <div
                        key={entry.name}
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
                        <SettingToggle
                          name={entry.name}
                          value={entry.value}
                          description={entry.description}
                          displayName={formatSettingName(entry.name)}
                          onChange={handleSettingChange}
                          disabled={isAppearanceCat && isAppearanceUploadBusy}
                          userData={userData}
                        />
                        {isAppearanceCat &&
                          entry.name === "custom_banner" &&
                          isSettingEnabled("custom_banner") && (
                            <BannerSettings
                              userData={userData}
                              onBannerUpdate={handleBannerUpdate}
                              onUploadStateChange={setIsBannerUploading}
                            />
                          )}
                        {isAppearanceCat &&
                          entry.name === "custom_avatar" &&
                          isSettingEnabled("custom_avatar") && (
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
                {isAppearanceCat &&
                  (isSettingEnabled("custom_banner") ||
                    isSettingEnabled("custom_avatar")) && (
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
                      onClick={() =>
                        copySectionLink(
                          "notifications",
                          "Notification Preferences",
                        )
                      }
                      className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                      aria-label="Copy section link"
                    >
                      <Icon icon="heroicons:link" className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                  >
                    <p>Copy URL</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </h2>
            <div className="border-border-card mb-2 border-t" />

            <DesktopNotificationToggle />
            <div className="border-border-card mb-2 border-t opacity-50" />

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
            style={getSectionHighlightStyle("connections")}
            ref={(el) => scrollHighlightedSectionIntoView("connections", el)}
          >
            <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
              <Icon icon="heroicons:link" className="h-6 w-6" />
              Account Connections
              {userData?.flags?.some((f) => f.flag === "is_owner") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        copySectionLink("connections", "Account Connections")
                      }
                      className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                      aria-label="Copy section link"
                    >
                      <Icon icon="heroicons:link" className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                  >
                    <p>Copy URL</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </h2>
            <div className="border-border-card mb-2 border-t" />
            <RobloxConnection userData={userData} />
          </div>

          <div
            id="export"
            className={`${cardClassName} text-primary-text mb-8 p-6`}
            style={getSectionHighlightStyle("export")}
            ref={(el) => scrollHighlightedSectionIntoView("export", el)}
          >
            <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
              <Icon icon="heroicons:arrow-down-tray" className="h-6 w-6" />
              Export Data
              {userData?.flags?.some((f) => f.flag === "is_owner") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => copySectionLink("export", "Export Data")}
                      className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                      aria-label="Copy section link"
                    >
                      <Icon icon="heroicons:link" className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                  >
                    <p>Copy URL</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </h2>
            <div className="border-border-card mb-2 border-t" />
            <ExportInventoryData />
          </div>

          <div
            id="gifts"
            className={`${cardClassName} text-primary-text mb-8 p-6`}
            style={getSectionHighlightStyle("gifts")}
            ref={(el) => scrollHighlightedSectionIntoView("gifts", el)}
          >
            <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
              <Icon icon="heroicons:gift" className="h-6 w-6" />
              Purchased Gifts
              {userData?.flags?.some((f) => f.flag === "is_owner") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        copySectionLink("gifts", "Purchased Gifts")
                      }
                      className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                      aria-label="Copy section link"
                    >
                      <Icon icon="heroicons:link" className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                  >
                    <p>Copy URL</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </h2>
            <p className="text-secondary-text mb-2 text-sm">
              Supporter gifts purchased on your account.
            </p>
            <p className="text-secondary-text mb-2 text-sm">
              Want to compare perks first?{" "}
              <Link
                href="/supporting"
                prefetch={false}
                className="text-link hover:text-link-hover transition-colors"
              >
                View supporter tier benefits
              </Link>
              .
            </p>
            <div className="border-border-card mb-3 border-t" />
            {supporterGifts.length === 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-secondary-text text-sm">
                  No gifts purchased yet.
                </p>
                <div className="flex justify-start">
                  <CustomButton
                    type="button"
                    size="sm"
                    onClick={openPurchaseGiftModal}
                  >
                    Purchase Gift
                  </CustomButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="max-h-[34rem] overflow-y-auto pr-1">
                  <div className="flex flex-col gap-3">
                    {sortedSupporterGifts.map((gift) => (
                      <div
                        key={gift.id}
                        className="bg-tertiary-bg border-border-card rounded-lg border p-4"
                      >
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-primary-text text-sm font-semibold">
                                {getSupporterGiftTierLabel(gift.level)}
                              </p>
                              {supporterIcons[gift.level] && (
                                <Image
                                  src={supporterIcons[gift.level]}
                                  alt={getSupporterGiftTierLabel(gift.level)}
                                  width={18}
                                  height={18}
                                  className="object-contain"
                                />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <CustomButton
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRedeemForSelf(gift.share_id)}
                              disabled={!!giftingIds[gift.share_id]}
                            >
                              {giftingIds[gift.share_id]
                                ? "Processing..."
                                : "Self Redeem"}
                            </CustomButton>
                            <CustomButton
                              type="button"
                              size="sm"
                              onClick={() => openGiftModalForGift(gift)}
                              disabled={!!giftingIds[gift.share_id]}
                            >
                              {giftingIds[gift.share_id]
                                ? "Processing..."
                                : "Gift to User"}
                            </CustomButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-start">
                  <CustomButton
                    type="button"
                    size="sm"
                    onClick={openPurchaseGiftModal}
                  >
                    Purchase Gift
                  </CustomButton>
                </div>
              </div>
            )}
          </div>

          <div
            id="danger"
            className={`${cardClassName} text-primary-text relative mb-8 p-6`}
            style={getSectionHighlightStyle("danger")}
            ref={(el) => scrollHighlightedSectionIntoView("danger", el)}
          >
            <div className="bg-button-danger absolute top-0 right-0 left-0 h-1 rounded-t-xl" />
            <h2 className="text-button-danger mb-2 flex items-center gap-1.5 text-xl font-bold">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="h-6 w-6"
                style={{ color: "var(--color-button-danger)" }}
              />
              Danger Zone
              {userData?.flags?.some((f) => f.flag === "is_owner") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => copySectionLink("danger", "Danger Zone")}
                      className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                      aria-label="Copy section link"
                    >
                      <Icon icon="heroicons:link" className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                  >
                    <p>Copy URL</p>
                  </TooltipContent>
                </Tooltip>
              )}
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
          <Dialog
            open={giftModalOpen}
            onClose={() => {}}
            className="relative z-3000"
          >
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative w-full max-w-md rounded-lg border shadow-xl">
                <div className="border-border-card flex items-center justify-between border-b p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-button-info rounded-lg p-2">
                      <Icon
                        icon="heroicons:gift"
                        className="text-form-button-text h-6 w-6"
                      />
                    </div>
                    <div>
                      <DialogTitle className="text-primary-text text-xl font-semibold">
                        {giftModalStep === "search"
                          ? "Gift to User"
                          : "Confirm Gift"}
                      </DialogTitle>
                      <p className="text-secondary-text text-sm">
                        {giftModalStep === "search"
                          ? "Choose who should receive this gift."
                          : "Review the recipient before sending."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGiftModalDismiss}
                    aria-label="Close"
                    className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
                  {giftModalStep === "search" ? (
                    <div className="flex flex-col gap-4">
                      {activeGift ? (
                        <div className="bg-tertiary-bg border-border-card flex items-center gap-3 rounded-lg border p-4">
                          {supporterIcons[activeGift.level] && (
                            <Image
                              src={supporterIcons[activeGift.level]}
                              alt={getSupporterGiftTierLabel(activeGift.level)}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <div>
                            <p className="text-primary-text text-sm font-semibold">
                              {getSupporterGiftTierLabel(activeGift.level)}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <div className="relative">
                        <Icon
                          icon="heroicons:magnifying-glass"
                          className="text-secondary-text pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                        />
                        <input
                          type="text"
                          value={giftSearchQuery}
                          onChange={(event) => {
                            setGiftSearchQuery(event.target.value);
                            setSelectedGiftRecipient(null);
                          }}
                          placeholder="Search user to gift..."
                          className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:border-button-info h-10 w-full rounded-lg border py-2 pr-3 pl-9 text-sm outline-none"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>

                      {giftSearchQuery.trim() ? (
                        giftSearchLoading ? (
                          <div className="flex items-center justify-center gap-2 py-2">
                            <Icon
                              icon="lucide:loader-2"
                              className="text-secondary-text h-4 w-4 animate-spin"
                            />
                            <span className="text-secondary-text text-sm">
                              Searching users...
                            </span>
                          </div>
                        ) : giftSearchResults.length > 0 ? (
                          <div className="border-border-card bg-tertiary-bg overflow-hidden rounded-lg border">
                            {giftSearchResults.map((result) => (
                              <button
                                key={result.id}
                                type="button"
                                onClick={() => {
                                  setSelectedGiftRecipient(result);
                                  setGiftModalStep("confirm");
                                }}
                                className="border-border-card hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0"
                              >
                                <UserAvatar
                                  userId={result.id}
                                  avatarHash={result.avatar}
                                  username={result.username}
                                  custom_avatar={result.custom_avatar}
                                  size={8}
                                  showBadge={false}
                                  settings={result.settings_v2}
                                  premiumType={result.premiumtype}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-primary-text truncate text-sm font-medium">
                                    {result.global_name &&
                                    result.global_name !== "None"
                                      ? result.global_name
                                      : result.username}
                                  </p>
                                  <p className="text-secondary-text truncate text-xs">
                                    @{result.username}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-secondary-text text-sm">
                            No users found.
                          </p>
                        )
                      ) : (
                        <p className="text-secondary-text text-sm">
                          Search for a user to open the gift confirmation.
                        </p>
                      )}
                    </div>
                  ) : activeGift && selectedGiftRecipient ? (
                    <div className="flex flex-col gap-4">
                      <div className="bg-tertiary-bg border-border-card flex items-center gap-3 rounded-lg border p-4">
                        <UserAvatar
                          userId={selectedGiftRecipient.id}
                          avatarHash={selectedGiftRecipient.avatar}
                          username={selectedGiftRecipient.username}
                          custom_avatar={selectedGiftRecipient.custom_avatar}
                          size={10}
                          showBadge={false}
                          settings={selectedGiftRecipient.settings_v2}
                          premiumType={selectedGiftRecipient.premiumtype}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {supporterIcons[activeGift.level] && (
                              <Image
                                src={supporterIcons[activeGift.level]}
                                alt={getSupporterGiftTierLabel(
                                  activeGift.level,
                                )}
                                width={20}
                                height={20}
                                className="object-contain"
                              />
                            )}
                            <p className="text-primary-text text-sm font-semibold">
                              {getSupporterGiftTierLabel(activeGift.level)}
                            </p>
                          </div>
                          <p className="text-primary-text truncate text-base font-semibold">
                            {selectedGiftRecipient.global_name &&
                            selectedGiftRecipient.global_name !== "None"
                              ? selectedGiftRecipient.global_name
                              : selectedGiftRecipient.username}
                          </p>
                          <p className="text-secondary-text truncate text-sm">
                            @{selectedGiftRecipient.username}
                          </p>
                          <p className="text-primary-text mt-2 text-sm">
                            You&apos;re about to gift{" "}
                            <span className="font-semibold">
                              {getSupporterGiftTierLabel(activeGift.level)}
                            </span>{" "}
                            to this user.
                          </p>
                          <p className="text-secondary-text mt-1 text-sm">
                            Confirm to send the gift.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-border-card flex justify-end gap-2 border-t px-6 py-4">
                  <CustomButton
                    type="button"
                    variant="secondary"
                    onClick={handleGiftModalDismiss}
                  >
                    Cancel
                  </CustomButton>
                  {giftModalStep === "confirm" ? (
                    <CustomButton
                      type="button"
                      onClick={handleGiftSubmit}
                      disabled={
                        !activeGift ||
                        !selectedGiftRecipient?.id ||
                        !!(activeGift && giftingIds[activeGift.share_id])
                      }
                    >
                      {activeGift && giftingIds[activeGift.share_id]
                        ? "Processing..."
                        : "Confirm Gift"}
                    </CustomButton>
                  ) : null}
                </div>
              </DialogPanel>
            </div>
          </Dialog>
          <Dialog
            open={purchaseGiftModalOpen}
            onClose={() => {}}
            className="relative z-3000"
          >
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative w-full max-w-md rounded-lg border shadow-xl">
                <div className="border-border-card flex items-center justify-between border-b p-4">
                  <h2 className="text-primary-text text-xl font-semibold">
                    Purchase Gift
                  </h2>
                  <button
                    type="button"
                    onClick={closePurchaseGiftModal}
                    aria-label="Close"
                    className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
                  <div className="flex flex-col gap-3">
                    <div className="border-border-card bg-tertiary-bg/45 rounded-lg border p-4">
                      <p className="text-primary-text text-sm font-medium">
                        Buy a supporter tier for yourself or purchase a gift to
                        redeem later or send to someone else. View supporter
                        benefits{" "}
                        <Link
                          href="/supporting"
                          prefetch={false}
                          className="text-link hover:text-link-hover transition-colors"
                        >
                          here
                        </Link>
                        .
                      </p>
                    </div>
                    {purchaseGiftLevelsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6">
                        <Icon
                          icon="lucide:loader-2"
                          className="text-secondary-text h-4 w-4 animate-spin"
                        />
                        <span className="text-secondary-text text-sm">
                          Loading gift tiers...
                        </span>
                      </div>
                    ) : purchaseGiftLevelsError ? (
                      <p className="text-button-danger text-sm">
                        {purchaseGiftLevelsError}
                      </p>
                    ) : purchaseGiftLevels.length === 0 ? (
                      <p className="text-secondary-text text-sm">
                        No gift tiers are available right now.
                      </p>
                    ) : (
                      <Tabs
                        value={purchaseGiftTab}
                        onValueChange={(value) =>
                          setPurchaseGiftTab(value as "self" | "gift")
                        }
                        className="w-full"
                      >
                        <TabsList fullWidth className="w-full">
                          <TabsTrigger value="self" fullWidth>
                            For Yourself
                          </TabsTrigger>
                          <TabsTrigger value="gift" fullWidth>
                            As Gift
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="self" className="mt-4">
                          <div className="flex flex-col gap-3">
                            {selfPurchaseLevels.map((level) => (
                              <div
                                key={level.id}
                                className="bg-tertiary-bg border-border-card flex items-center justify-between gap-3 rounded-lg border p-4"
                              >
                                <div className="min-w-0">
                                  <div className="mb-1 flex items-center gap-2">
                                    {supporterIcons[level.level] && (
                                      <Image
                                        src={supporterIcons[level.level]}
                                        alt={level.name}
                                        width={18}
                                        height={18}
                                        className="object-contain"
                                      />
                                    )}
                                    <p className="text-primary-text text-sm font-semibold">
                                      {level.name}
                                    </p>
                                  </div>
                                  <p className="text-secondary-text text-sm">
                                    ${level.price_str}
                                  </p>
                                </div>
                                <CustomButton
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      level.url,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                >
                                  Buy Tier
                                </CustomButton>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="gift" className="mt-4">
                          <div className="flex flex-col gap-3">
                            {giftPurchaseLevels.map((level) => (
                              <div
                                key={level.id}
                                className="bg-tertiary-bg border-border-card flex items-center justify-between gap-3 rounded-lg border p-4"
                              >
                                <div className="min-w-0">
                                  <div className="mb-1 flex items-center gap-2">
                                    {supporterIcons[level.level] && (
                                      <Image
                                        src={supporterIcons[level.level]}
                                        alt={level.name}
                                        width={18}
                                        height={18}
                                        className="object-contain"
                                      />
                                    )}
                                    <p className="text-primary-text text-sm font-semibold">
                                      {level.name}
                                    </p>
                                  </div>
                                  <p className="text-secondary-text text-sm">
                                    ${level.price_str}
                                  </p>
                                </div>
                                <CustomButton
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      level.url,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                >
                                  Buy Gift
                                </CustomButton>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                    {!purchaseGiftLevelsLoading &&
                    !purchaseGiftLevelsError &&
                    purchaseGiftLevels.length > 0 ? (
                      <p className="text-secondary-text pt-1 text-center text-sm">
                        <Link
                          href="/privacy"
                          prefetch={false}
                          className="text-link hover:text-link-hover transition-colors"
                        >
                          Privacy Policy
                        </Link>
                        {" | "}
                        <Link
                          href="/tos"
                          prefetch={false}
                          className="text-link hover:text-link-hover transition-colors"
                        >
                          Terms of Service
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="border-border-card flex justify-end gap-2 border-t px-6 py-4">
                  <CustomButton
                    type="button"
                    variant="secondary"
                    onClick={closePurchaseGiftModal}
                  >
                    Close
                  </CustomButton>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
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
