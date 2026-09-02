"use client";

import { useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { SupporterLevel, UserData, UserSettingsV2 } from "@/types/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSettingName } from "@/config/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingToggle } from "@/components/Settings/SettingToggle";
import { BannerSettings } from "@/components/Settings/BannerSettings";
import { AvatarSettings } from "@/components/Settings/AvatarSettings";
import ImageHostLinks from "@/components/Settings/ImageHostLinks";
import SettingsCard from "@/components/Settings/SettingsCard";
import SupporterLevelRow from "@/components/Settings/SupporterLevelRow";
import SupporterHistorySection from "@/components/Settings/SupporterHistorySection";
import PurchasedGiftsSection from "@/components/Settings/PurchasedGiftsSection";
import GiftToUserDialog from "@/components/Settings/GiftToUserDialog";
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
import { fetchSupporterGiftLevels } from "@/services/settingsService";
import { useSectionHighlight } from "@/hooks/useSectionHighlight";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useSupporterLevelActions } from "@/hooks/useSupporterLevelActions";
import { useSupporterGifting } from "@/hooks/useSupporterGifting";
import SettingsLoading from "./loading";

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
  const {
    revertingSupporterLevel,
    handleSupporterLevelUpdate,
    handleRemoveSupporter,
  } = useSupporterLevelActions({ userData, setSupporterHistory });
  const {
    giftingIds,
    giftModalOpen,
    giftModalStep,
    activeGift,
    giftSearchQuery,
    giftSearchResults,
    giftSearchLoading,
    selectedGiftRecipient,
    handleGiftModalDismiss,
    openGiftModalForGift,
    handleGiftSearchQueryChange,
    handleGiftRecipientSelect,
    handleGiftSubmit,
    handleRedeemForSelf,
  } = useSupporterGifting({
    userId: user?.id ?? null,
    setSupporterGifts,
  });
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
              <SupporterHistorySection
                history={sortedSupporterHistory}
                currentLevel={currentSupporterLevel}
                revertingLevel={revertingSupporterLevel}
                onUpdateLevel={handleSupporterLevelUpdate}
                onRemove={handleRemoveSupporter}
              />
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
            <PurchasedGiftsSection
              gifts={sortedSupporterGifts}
              giftingIds={giftingIds}
              onRedeemForSelf={handleRedeemForSelf}
              onOpenGiftModal={openGiftModalForGift}
              onPurchaseGift={openPurchaseGiftModal}
            />
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
          <GiftToUserDialog
            open={giftModalOpen}
            step={giftModalStep}
            activeGift={activeGift}
            searchQuery={giftSearchQuery}
            onSearchQueryChange={handleGiftSearchQueryChange}
            searchResults={giftSearchResults}
            searchLoading={giftSearchLoading}
            selectedRecipient={selectedGiftRecipient}
            onSelectRecipient={handleGiftRecipientSelect}
            giftingIds={giftingIds}
            onDismiss={handleGiftModalDismiss}
            onSubmit={handleGiftSubmit}
          />
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
