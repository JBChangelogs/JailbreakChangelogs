"use client";

import { useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import { UserData, UserSettingsV2 } from "@/types/auth";
import { formatSettingName } from "@/config/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingToggle } from "@/components/Settings/SettingToggle";
import { BannerSettings } from "@/components/Settings/BannerSettings";
import { AvatarSettings } from "@/components/Settings/AvatarSettings";
import ImageHostLinks from "@/components/Settings/ImageHostLinks";
import SettingsCard from "@/components/Settings/SettingsCard";
import SupporterHistorySection from "@/components/Settings/SupporterHistorySection";
import PurchasedGiftsSection from "@/components/Settings/PurchasedGiftsSection";
import GiftToUserDialog from "@/components/Settings/GiftToUserDialog";
import PurchaseGiftDialog from "@/components/Settings/PurchaseGiftDialog";
import { Icon } from "@/components/ui/IconWrapper";
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
import { NotificationPreferenceToggle } from "@/components/Settings/NotificationPreferenceToggle";
import { DesktopNotificationToggle } from "@/components/Settings/DesktopNotificationToggle";
import { EmailNotificationSettings } from "@/components/Settings/EmailNotificationSettings";
import { useSectionHighlight } from "@/hooks/useSectionHighlight";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useSupporterLevelActions } from "@/hooks/useSupporterLevelActions";
import { useSupporterGifting } from "@/hooks/useSupporterGifting";
import { usePurchaseGiftModal } from "@/hooks/usePurchaseGiftModal";
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
  const {
    open: purchaseGiftModalOpen,
    openModal: openPurchaseGiftModal,
    closeModal: closePurchaseGiftModal,
    tab: purchaseGiftTab,
    setTab: setPurchaseGiftTab,
    selfLevels: selfPurchaseLevels,
    giftLevels: giftPurchaseLevels,
    loading: purchaseGiftLevelsLoading,
    error: purchaseGiftLevelsError,
  } = usePurchaseGiftModal();

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
  const currentSupporterLevel = userData.premiumtype ?? 0;
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
          <PurchaseGiftDialog
            open={purchaseGiftModalOpen}
            onClose={closePurchaseGiftModal}
            tab={purchaseGiftTab}
            onTabChange={setPurchaseGiftTab}
            selfLevels={selfPurchaseLevels}
            giftLevels={giftPurchaseLevels}
            loading={purchaseGiftLevelsLoading}
            error={purchaseGiftLevelsError}
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
