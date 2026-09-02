"use client";

import { useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  SupporterGift,
  SupporterHistoryEntry,
  SupporterLevel,
  UserData,
  UserSettingsV2,
} from "@/types/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSettingName } from "@/config/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingToggle } from "@/components/Settings/SettingToggle";
import { BannerSettings } from "@/components/Settings/BannerSettings";
import { AvatarSettings } from "@/components/Settings/AvatarSettings";
import ImageHostLinks from "@/components/Settings/ImageHostLinks";
import SettingsCard from "@/components/Settings/SettingsCard";
import SupporterLevelRow from "@/components/Settings/SupporterLevelRow";
import { Icon } from "@/components/ui/IconWrapper";
import { Button as CustomButton } from "@/components/ui/button";
import { DeleteAccount } from "@/components/Settings/DeleteAccount";
import { RobloxConnection } from "@/components/Settings/RobloxConnection";
import { ExportInventoryData } from "@/components/Settings/ExportInventoryData";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTwemoji } from "@/contexts/TwemojiContext";
import SupporterModal from "@/components/Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { safeSetJSON } from "@/utils/storage/safeStorage";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import { NotificationPreferenceToggle } from "@/components/Settings/NotificationPreferenceToggle";
import { DesktopNotificationToggle } from "@/components/Settings/DesktopNotificationToggle";
import { EmailNotificationSettings } from "@/components/Settings/EmailNotificationSettings";
import {
  fetchSupporterGiftLevels,
  giftSupporterGift,
  revertSupporterLevel,
} from "@/services/settingsService";
import { UserAvatar } from "@/utils/ui/avatar";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useSectionHighlight } from "@/hooks/useSectionHighlight";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import SettingsLoading from "./loading";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";
const supporterIcons: Record<number, string> = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

export default function SettingsPage() {
  const { user, isLoading } = useAuthContext();
  const { twemojiEnabled, setTwemojiEnabled } = useTwemoji();
  const { modalState, closeModal, openModal } = useSupporterModal();
  const router = useRouter();
  const {
    highlightSetting,
    showHighlight,
    copySectionLink,
    getSectionHighlightStyle,
    scrollHighlightedSectionIntoView,
  } = useSectionHighlight();
  const {
    prefs: notificationPrefs,
    loading: notificationPrefsLoading,
    saving: notificationPrefsSaving,
    error: notificationPrefsError,
    handleToggle: handleNotificationPrefToggle,
  } = useNotificationPreferences(!isLoading && user ? user.id : null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  // Derive state from props instead of setting in useEffect
  const userData = user;
  const loading = isLoading;
  const cardClassName =
    "border-border-card bg-secondary-bg rounded-xl border shadow-md";

  const {
    settings,
    supporterGifts,
    setSupporterGifts,
    supporterHistory,
    setSupporterHistory,
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
  const [revertingSupporterLevel, setRevertingSupporterLevel] = useState<
    number | null
  >(null);
  const [purchaseGiftTab, setPurchaseGiftTab] = useState<"self" | "gift">(
    "gift",
  );
  const { results: giftSearchResults, isLoading: giftSearchLoading } =
    useUserSearch(giftSearchQuery, user?.id ?? null, {
      limit: 5,
      enabled: giftModalOpen && !!activeGift,
    });

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not authenticated and auth is not loading
      router.push("/");
    }
  }, [user, isLoading, router]);

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
    return <SettingsLoading />;
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
  const sortedSupporterHistory = [...supporterHistory].sort((a, b) => {
    if (a.level !== b.level) return b.level - a.level;
    return (b.created_at ?? 0) - (a.created_at ?? 0);
  });
  const hasSupporterHistory = sortedSupporterHistory.length > 0;
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
  const getSupporterTierLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Supporter Tier 1";
      case 2:
        return "Supporter Tier 2";
      case 3:
        return "Supporter Tier 3";
      default:
        return `Supporter Tier ${level}`;
    }
  };
  const getSupporterHistoryKey = (
    entry: SupporterHistoryEntry,
    index: number,
  ) => `${entry.level}-${entry.created_at}-${index}`;
  const handleSupporterLevelUpdate = async (level: number) => {
    if (!userData) {
      return;
    }

    setRevertingSupporterLevel(level);
    try {
      await revertSupporterLevel(level);

      const updatedUser: UserData = {
        ...userData,
        premiumtype: level,
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );

      setSupporterHistory((prev) => {
        const nextEntry = {
          level,
          created_at: Math.floor(Date.now() / 1000),
        };

        const withoutSameLevel = prev.filter((entry) => entry.level !== level);
        return [...withoutSameLevel, nextEntry];
      });

      toast.success("Supporter tier updated. Changes will be applied shortly.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update supporter level",
      );
    } finally {
      setRevertingSupporterLevel(null);
    }
  };
  const handleRemoveSupporter = async () => {
    if (!userData) {
      return;
    }

    setRevertingSupporterLevel(0);
    try {
      await revertSupporterLevel(0);

      const updatedUser: UserData = {
        ...userData,
        premiumtype: 0,
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );

      toast.success("Supporter removed. Changes will be applied shortly.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove supporter",
      );
    } finally {
      setRevertingSupporterLevel(null);
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
  const currentSupporterLevel = userData.premiumtype ?? 0;
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
      toast.info("You must be logged in to redeem this gift.");
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
              ...(hasSupporterHistory
                ? [
                    {
                      id: "supporter-history",
                      title: "Supporter History",
                      icon: "heroicons:clock",
                    },
                  ]
                : []),
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
              <SettingsCard
                key={cat.name}
                id={cat.name}
                title={categoryDisplayName}
                icon={
                  cat.name === "privacy"
                    ? "heroicons:lock-closed"
                    : "heroicons:sparkles"
                }
                isOwner={
                  userData.flags?.some((f) => f.flag === "is_owner") ?? false
                }
                highlightStyle={getSectionHighlightStyle(cat.name)}
                scrollRef={(el) =>
                  scrollHighlightedSectionIntoView(cat.name, el)
                }
                onCopyLink={() =>
                  copySectionLink(cat.name, categoryDisplayName)
                }
                copyAriaLabel="Copy category link"
                headerAccessory={
                  <p className="text-secondary-text mb-2 text-sm">
                    {cat.description}
                  </p>
                }
              >
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
                  {isAppearanceCat && (
                    <SettingToggle
                      name="twemoji_enabled"
                      value={twemojiEnabled}
                      description="Use Twemoji for emojis instead of your browser's native emoji set"
                      displayName="Twemoji Emojis"
                      onChange={(_name, value) => {
                        setTwemojiEnabled(value);
                        const displayName =
                          formatSettingName("twemoji_enabled");
                        toast.success("Setting Updated", {
                          description: `"${displayName}" has been ${value ? "enabled" : "disabled"}.`,
                        });
                      }}
                      userData={userData}
                    />
                  )}
                </div>
                {isAppearanceCat &&
                  (isSettingEnabled("custom_banner") ||
                    isSettingEnabled("custom_avatar")) && (
                    <>
                      <div className="border-border-card my-2 border-t" />
                      <ImageHostLinks />
                    </>
                  )}
              </SettingsCard>
            );
          })}

          <SettingsCard
            id="notifications"
            title="Notification Preferences"
            icon="heroicons:bell"
            isOwner={
              userData.flags?.some((f) => f.flag === "is_owner") ?? false
            }
            highlightStyle={getSectionHighlightStyle("notifications")}
            scrollRef={(el) =>
              scrollHighlightedSectionIntoView("notifications", el)
            }
            onCopyLink={() =>
              copySectionLink("notifications", "Notification Preferences")
            }
            className="scroll-mt-24"
          >
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
          </SettingsCard>

          <SettingsCard
            id="connections"
            title="Account Connections"
            icon="heroicons:link"
            isOwner={
              userData.flags?.some((f) => f.flag === "is_owner") ?? false
            }
            highlightStyle={getSectionHighlightStyle("connections")}
            scrollRef={(el) =>
              scrollHighlightedSectionIntoView("connections", el)
            }
            onCopyLink={() =>
              copySectionLink("connections", "Account Connections")
            }
          >
            <RobloxConnection userData={userData} />
          </SettingsCard>

          <SettingsCard
            id="export"
            title="Export Data"
            icon="heroicons:arrow-down-tray"
            isOwner={
              userData.flags?.some((f) => f.flag === "is_owner") ?? false
            }
            highlightStyle={getSectionHighlightStyle("export")}
            scrollRef={(el) => scrollHighlightedSectionIntoView("export", el)}
            onCopyLink={() => copySectionLink("export", "Export Data")}
          >
            <ExportInventoryData />
          </SettingsCard>

          {hasSupporterHistory ? (
            <SettingsCard
              id="supporter-history"
              title="Supporter History"
              icon="heroicons:clock"
              isOwner={
                userData.flags?.some((f) => f.flag === "is_owner") ?? false
              }
              highlightStyle={getSectionHighlightStyle("supporter-history")}
              scrollRef={(el) =>
                scrollHighlightedSectionIntoView("supporter-history", el)
              }
              onCopyLink={() =>
                copySectionLink("supporter-history", "Supporter History")
              }
              headerAccessory={
                <p className="text-secondary-text mb-2 text-sm">
                  Previous supporter tiers recorded on your account.
                </p>
              }
              dividerClassName="border-border-card mb-3 border-t"
            >
              <div className="flex flex-col gap-3">
                {sortedSupporterHistory.map((entry, index) => {
                  const isCurrentTier = currentSupporterLevel === entry.level;
                  const isUpgrade = entry.level > currentSupporterLevel;

                  return (
                    <div
                      key={getSupporterHistoryKey(entry, index)}
                      className="bg-tertiary-bg border-border-card rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            {supporterIcons[entry.level] && (
                              <Image
                                src={supporterIcons[entry.level]}
                                alt={getSupporterTierLabel(entry.level)}
                                width={18}
                                height={18}
                                className="object-contain"
                              />
                            )}
                            <p className="text-primary-text text-sm font-semibold">
                              {getSupporterTierLabel(entry.level)}
                            </p>
                          </div>
                        </div>
                        {!isCurrentTier ? (
                          <CustomButton
                            type="button"
                            size="sm"
                            onClick={() =>
                              handleSupporterLevelUpdate(entry.level)
                            }
                            disabled={revertingSupporterLevel !== null}
                          >
                            {revertingSupporterLevel === entry.level
                              ? isUpgrade
                                ? "Upgrading..."
                                : "Downgrading..."
                              : isUpgrade
                                ? "Upgrade"
                                : "Downgrade"}
                          </CustomButton>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {currentSupporterLevel > 0 && (
                  <div className="bg-tertiary-bg border-border-card rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-primary-text text-sm font-semibold">
                            Free Tier
                          </p>
                        </div>
                        <p className="text-secondary-text text-xs">
                          Remove your current supporter tier.
                        </p>
                      </div>
                      <CustomButton
                        type="button"
                        size="sm"
                        onClick={handleRemoveSupporter}
                        disabled={revertingSupporterLevel !== null}
                      >
                        {revertingSupporterLevel === 0
                          ? "Downgrading..."
                          : "Downgrade"}
                      </CustomButton>
                    </div>
                  </div>
                )}
              </div>
            </SettingsCard>
          ) : null}

          <SettingsCard
            id="gifts"
            title="Purchased Gifts"
            icon="heroicons:gift"
            isOwner={
              userData.flags?.some((f) => f.flag === "is_owner") ?? false
            }
            highlightStyle={getSectionHighlightStyle("gifts")}
            scrollRef={(el) => scrollHighlightedSectionIntoView("gifts", el)}
            onCopyLink={() => copySectionLink("gifts", "Purchased Gifts")}
            headerAccessory={
              <>
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
              </>
            }
            dividerClassName="border-border-card mb-3 border-t"
          >
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
          </SettingsCard>

          <SettingsCard
            id="danger"
            title="Danger Zone"
            icon="heroicons:exclamation-triangle"
            isOwner={
              userData.flags?.some((f) => f.flag === "is_owner") ?? false
            }
            highlightStyle={getSectionHighlightStyle("danger")}
            scrollRef={(el) => scrollHighlightedSectionIntoView("danger", el)}
            onCopyLink={() => copySectionLink("danger", "Danger Zone")}
            variant="danger"
          >
            <DeleteAccount />
          </SettingsCard>

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
            onOpenChange={(open) => !open && handleGiftModalDismiss()}
          >
            <DialogContent
              className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
              showClose
              aria-describedby={undefined}
            >
              <DialogHeader className="px-6 pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-button-info rounded-lg p-2">
                    <Icon
                      icon="heroicons:gift"
                      className="text-form-button-text h-6 w-6"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <DialogTitle className="text-primary-text text-xl font-semibold">
                      {giftModalStep === "search"
                        ? "Gift to User"
                        : "Confirm Gift"}
                    </DialogTitle>
                    <p className="text-secondary-text mt-1 text-sm font-normal">
                      {giftModalStep === "search"
                        ? "Choose who should receive this gift."
                        : "Review the recipient before sending."}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 pt-4 pb-6">
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
                          <Spinner className="h-4 w-4" />
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
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-secondary-text mb-1 text-xs font-semibold tracking-wide uppercase">
                        Tier
                      </p>
                      <div className="bg-tertiary-bg border-border-card flex items-center gap-2 rounded-lg border p-3">
                        {supporterIcons[activeGift.level] && (
                          <Image
                            src={supporterIcons[activeGift.level]}
                            alt={getSupporterGiftTierLabel(activeGift.level)}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        )}
                        <p className="text-primary-text text-sm font-semibold">
                          {getSupporterGiftTierLabel(activeGift.level)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-secondary-text mb-1 text-xs font-semibold tracking-wide uppercase">
                        Recipient
                      </p>
                      <Link
                        href={`/users/${selectedGiftRecipient.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        prefetch={false}
                        className="bg-tertiary-bg border-border-card hover:bg-tertiary-bg/70 group flex items-center gap-3 rounded-lg border p-3 transition-colors"
                      >
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
                          <p className="text-primary-text group-hover:text-link truncate text-sm font-semibold transition-colors">
                            {selectedGiftRecipient.global_name &&
                            selectedGiftRecipient.global_name !== "None"
                              ? selectedGiftRecipient.global_name
                              : selectedGiftRecipient.username}
                          </p>
                          <p className="text-secondary-text truncate text-sm">
                            @{selectedGiftRecipient.username}
                          </p>
                        </div>
                        <Icon
                          icon="akar-icons:link-out"
                          className="text-link h-4 w-4 shrink-0"
                        />
                      </Link>
                    </div>
                  </div>
                ) : null}

                <DialogFooter className="mt-4 gap-2 pt-2">
                  <DialogClose asChild>
                    <CustomButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        if (giftModalStep === "confirm") {
                          e.preventDefault();
                          handleGiftModalDismiss();
                        }
                      }}
                    >
                      {giftModalStep === "confirm" ? "Back" : "Cancel"}
                    </CustomButton>
                  </DialogClose>
                  {giftModalStep === "confirm" ? (
                    <CustomButton
                      type="button"
                      size="sm"
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
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={purchaseGiftModalOpen}
            onOpenChange={(open) => !open && closePurchaseGiftModal()}
          >
            <DialogContent
              className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
              showClose
              aria-describedby={undefined}
            >
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-primary-text text-left text-xl font-semibold">
                  Purchase Gift
                </DialogTitle>
              </DialogHeader>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 pt-4 pb-6">
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
                      <Spinner className="h-4 w-4" />
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
                            <SupporterLevelRow
                              key={level.id}
                              level={level}
                              buttonLabel="Buy Tier"
                              onBuy={() =>
                                window.open(
                                  level.url,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                            />
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="gift" className="mt-4">
                        <div className="flex flex-col gap-3">
                          {giftPurchaseLevels.map((level) => (
                            <SupporterLevelRow
                              key={level.id}
                              level={level}
                              buttonLabel="Buy Gift"
                              onBuy={() =>
                                window.open(
                                  level.url,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                            />
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

                <DialogFooter className="mt-4 gap-2 pt-2">
                  <DialogClose asChild>
                    <CustomButton type="button" variant="ghost" size="sm">
                      Cancel
                    </CustomButton>
                  </DialogClose>
                </DialogFooter>
              </div>
            </DialogContent>
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
