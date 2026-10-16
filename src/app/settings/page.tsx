"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { UserData } from "@/types/auth";
import { formatSettingName } from "@/config/settings";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useQuery } from "@tanstack/react-query";
import { ProfileBackground } from "@/components/Profile/ProfileBackground";
import { fetchCustomBackground } from "@/services/settingsService";
import { useSettings } from "@/hooks/useSettings";
import { SettingToggle } from "@/components/Settings/SettingToggle";
import { AccentColorSetting } from "@/components/Settings/AccentColorSetting";
import { AppearancePreview } from "@/components/Settings/AppearancePreview";
import { BackgroundSettings } from "@/components/Settings/BackgroundSettings";
import DesktopNavigationSettings from "@/components/Settings/DesktopNavigationSettings";
import ThemeSettings from "@/components/Settings/ThemeSettings";
import TabStyleSettings from "@/components/Settings/TabStyleSettings";
import SettingsCard, {
  SETTINGS_LIST,
} from "@/components/Settings/SettingsCard";
import SupporterHistorySection from "@/components/Settings/SupporterHistorySection";
import PurchasedGiftsSection from "@/components/Settings/PurchasedGiftsSection";
import GiftToUserDialog from "@/components/Settings/GiftToUserDialog";
import PurchaseGiftDialog from "@/components/Settings/PurchaseGiftDialog";
import { DeleteAccount } from "@/components/Settings/DeleteAccount";
import { DeleteInventoryData } from "@/components/Settings/DeleteInventoryData";
import { RobloxConnection } from "@/components/Settings/RobloxConnection";
import { ExportInventoryData } from "@/components/Settings/ExportInventoryData";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTwemoji } from "@/contexts/TwemojiContext";
import SupporterModal from "@/components/Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { safeSetJSON } from "@/utils/storage/safeStorage";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { toast } from "sonner";
import { NotificationTypeSettings } from "@/components/Settings/NotificationTypeSettings";
import { SettingsSubsectionHeading } from "@/components/Settings/SettingsSubsectionHeading";
import { DesktopNotificationToggle } from "@/components/Settings/DesktopNotificationToggle";
import {
  EmailConnection,
  EmailNotificationSettings,
} from "@/components/Settings/EmailNotificationSettings";
import { SettingsSidebar } from "@/components/Settings/SettingsSidebar";
import { useSectionHighlight } from "@/hooks/useSectionHighlight";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useSupporterLevelActions } from "@/hooks/useSupporterLevelActions";
import { useSupporterGifting } from "@/hooks/useSupporterGifting";
import { usePurchaseGiftModal } from "@/hooks/usePurchaseGiftModal";
import SettingsLoading from "./loading";

const APP_ONLY_SETTINGS = new Set(["hide_roblox_activity"]);
const PREVIEW_SETTINGS = new Set(["custom_avatar", "custom_banner"]);

// One icon per section, shared by the sidebar and the card headings. Filled
// and rounded, like the site's own navigation.
const SECTION_ICONS: Record<string, string> = {
  themes: "material-symbols:palette-rounded",
  display: "material-symbols:desktop-windows-rounded",
  appearance: "material-symbols:auto-awesome-rounded",
  privacy: "material-symbols:lock-rounded",
  notifications: "material-symbols:notifications-rounded",
  connections: "material-symbols:link-rounded",
  export: "material-symbols:download-rounded",
  "supporter-history": "material-symbols:history-rounded",
  gifts: "material-symbols:redeem-rounded",
  danger: "material-symbols:warning-rounded",
};
const sectionIcon = (id: string) =>
  SECTION_ICONS[id] ?? "material-symbols:settings-rounded";

export default function SettingsPage() {
  const { user, isLoading, refreshUser, setLoginModal } = useAuthContext();
  const { twemojiEnabled, setTwemojiEnabled } = useTwemoji();
  const { modalState, closeModal, openModal } = useSupporterModal();
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
  // Banner and avatar uploads both run from the appearance preview.
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  const [isBackgroundUploading, setIsBackgroundUploading] = useState(false);

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
    setSettingValue,
  } = useSettings(userData, openModal, refreshUser);
  const accentColor = useAccentColor(userData?.id);
  // The custom background shows behind settings like it does on the
  // profile, so changes to it are seen in place. Same query as the uploader,
  // so a new upload shows here at once.
  const customBackgroundOn = Object.values(settings ?? {}).some((cat) =>
    cat.settings.some(
      (entry) => entry.name === "custom_background" && entry.value === true,
    ),
  );
  const { data: customBackground } = useQuery({
    queryKey: ["custom-background", userData?.id],
    queryFn: fetchCustomBackground,
    enabled: !!userData && customBackgroundOn,
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
  });
  // The section at the top of the screen, marked in the sidebar the way the
  // site's own sidebar marks the current page.
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // While a sidebar click scrolls, the clicked section stays marked instead
  // of each section it passes.
  const scrollLockRef = useRef(0);
  const selectSection = (id: string) => {
    setActiveSection(id);
    scrollLockRef.current = Date.now() + 1000;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < scrollLockRef.current) return;
      const sections = [
        ...document.querySelectorAll<HTMLElement>(".settings-content > [id]"),
      ];
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      const passed = sections.filter(
        (section) => section.getBoundingClientRect().top <= 140,
      );
      setActiveSection(
        (atBottom ? sections.at(-1) : (passed.at(-1) ?? sections[0]))?.id ??
          null,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onScrollEnd = () => {
      scrollLockRef.current = 0;
      onScroll();
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", onScroll);
    };
  }, [settingsLoading, userData]);
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

  const handleBannerUpdate = (newBannerUrl: string) => {
    if (userData) {
      const updatedUser: UserData = {
        ...userData,
        custom_banner: newBannerUrl,
        banner: userData.settings_v2?.custom_banner
          ? newBannerUrl
          : userData.banner,
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
        avatar: userData.settings_v2?.custom_avatar
          ? newAvatarUrl
          : userData.avatar,
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );
    }
  };

  const isOwner = userData?.flags?.some((f) => f.flag === "is_owner") ?? false;
  // Themes first, since the header's theme button opens that card.
  const displaySettings = (
    <>
      <SettingsCard
        id="themes"
        title="Themes"
        icon={sectionIcon("themes")}
        isOwner={isOwner}
        highlightStyle={getSectionHighlightStyle("themes")}
        scrollRef={(el) => scrollHighlightedSectionIntoView("themes", el)}
        onCopyLink={() => copySectionLink("themes", "Themes")}
      >
        <ThemeSettings />
      </SettingsCard>
      <SettingsCard
        id="display"
        title="Display"
        icon={sectionIcon("display")}
        isOwner={isOwner}
        highlightStyle={getSectionHighlightStyle("display")}
        scrollRef={(el) => scrollHighlightedSectionIntoView("display", el)}
        onCopyLink={() => copySectionLink("display", "Display")}
      >
        <div className={SETTINGS_LIST}>
          <TabStyleSettings />
          <DesktopNavigationSettings />
          <SettingToggle
            name="twemoji_enabled"
            value={twemojiEnabled}
            description="Use Twemoji for emojis instead of your browser's native emoji set"
            displayName="Twemoji Emojis"
            onChange={(_name, value) => {
              setTwemojiEnabled(value);
              toast.success("Setting Updated", {
                description: `"${formatSettingName("twemoji_enabled")}" has been ${value ? "enabled" : "disabled"}.`,
              });
            }}
            userData={userData}
          />
        </div>
      </SettingsCard>
    </>
  );

  if (loading) {
    return <SettingsLoading />;
  }

  if (!userData) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="mt-4">{displaySettings}</div>
        <p className="text-secondary-text mt-4 text-sm">
          <button
            type="button"
            onClick={() => setLoginModal({ open: true })}
            className="text-link hover:text-link-hover focus-visible:ring-link cursor-pointer rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Sign in
          </button>{" "}
          to access account settings and sync your navigation preference across
          devices.
        </p>
      </div>
    );
  }

  if (settingsLoading) {
    return <SettingsLoading />;
  }

  if (!settings) return null;

  // Appearance leads, then Display, then the other categories.
  const sortedCategories = Object.values(settings).sort(
    (a, b) =>
      Number(b.name === "appearance") - Number(a.name === "appearance") ||
      a.index - b.index,
  );
  const hasAppearance = sortedCategories.some(
    (cat) => cat.name === "appearance",
  );
  const displayNavItems = [
    { id: "themes", title: "Themes", icon: sectionIcon("themes") },
    { id: "display", title: "Display", icon: sectionIcon("display") },
  ];

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
    // Full width, so the background fills the page like on the profile;
    // the content stays centered inside.
    <div className="relative isolate min-h-screen">
      {customBackgroundOn && customBackground && (
        <ProfileBackground src={customBackground} />
      )}
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="-mt-2 mb-0">
          <Breadcrumb />
        </div>
        <div className="settings-layout mt-4">
          {/* Sidebar Navigation */}
          <div className="settings-sidebar">
            <SettingsSidebar
              className={`${cardClassName} p-3`}
              active={activeSection}
              onSelect={selectSection}
              sections={[
                {
                  title: "Preferences",
                  items: [
                    ...(hasAppearance ? [] : displayNavItems),
                    ...sortedCategories.flatMap((cat) => [
                      {
                        id: cat.name,
                        title:
                          cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
                        icon: sectionIcon(cat.name),
                      },
                      ...(cat.name === "appearance" ? displayNavItems : []),
                    ]),
                    {
                      id: "notifications",
                      title: "Notifications",
                      icon: sectionIcon("notifications"),
                    },
                  ],
                },
                {
                  title: "Account",
                  items: [
                    {
                      id: "connections",
                      title: "Connections",
                      icon: sectionIcon("connections"),
                    },
                    {
                      id: "export",
                      title: "Export Data",
                      icon: sectionIcon("export"),
                    },
                    ...(hasSupporterHistory
                      ? [
                          {
                            id: "supporter-history",
                            title: "Supporter History",
                            icon: sectionIcon("supporter-history"),
                          },
                        ]
                      : []),
                    {
                      id: "gifts",
                      title: "Purchased Gifts",
                      icon: sectionIcon("gifts"),
                    },
                    {
                      id: "danger",
                      title: "Danger Zone",
                      icon: sectionIcon("danger"),
                    },
                  ],
                },
              ]}
            />
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {!hasAppearance && displaySettings}
            {sortedCategories.map((cat) => {
              const categoryDisplayName =
                cat.name.charAt(0).toUpperCase() + cat.name.slice(1);
              const sortedSettings = cat.settings
                .filter((entry) => !APP_ONLY_SETTINGS.has(entry.name))
                .sort((a, b) => a.index - b.index);
              const isAppearanceCat = cat.name === "appearance";
              // Custom banner and avatar toggles live inside the preview.
              const listedSettings = isAppearanceCat
                ? sortedSettings.filter(
                    (entry) => !PREVIEW_SETTINGS.has(entry.name),
                  )
                : sortedSettings;
              // Shown just above the custom background setting.
              const accentSetting = isAppearanceCat && (
                <AccentColorSetting
                  accent={accentColor.accent}
                  customAccent={accentColor.customAccent}
                  onChange={accentColor.setAccent}
                  onReset={() => void accentColor.reset()}
                  userData={userData}
                />
              );
              return (
                <Fragment key={cat.name}>
                  <SettingsCard
                    id={cat.name}
                    title={categoryDisplayName}
                    icon={sectionIcon(cat.name)}
                    isOwner={
                      userData.flags?.some((f) => f.flag === "is_owner") ??
                      false
                    }
                    highlightStyle={getSectionHighlightStyle(cat.name)}
                    scrollRef={(el) =>
                      scrollHighlightedSectionIntoView(cat.name, el)
                    }
                    onCopyLink={() =>
                      copySectionLink(cat.name, categoryDisplayName)
                    }
                    copyAriaLabel="Copy category link"
                    // Skip descriptions that only repeat the title, such as
                    // "Privacy Settings".
                    headerAccessory={
                      cat.description &&
                      cat.description.trim().toLowerCase() !==
                        `${cat.name} settings`.toLowerCase() ? (
                        <p>{cat.description}</p>
                      ) : undefined
                    }
                  >
                    <div className={SETTINGS_LIST}>
                      {isAppearanceCat && (
                        <AppearancePreview
                          userData={userData}
                          customAvatarOn={
                            sortedSettings.find(
                              (e) => e.name === "custom_avatar",
                            )?.value === true
                          }
                          customBannerOn={
                            sortedSettings.find(
                              (e) => e.name === "custom_banner",
                            )?.value === true
                          }
                          onAvatarUploaded={(url, enabled) => {
                            handleAvatarUpdate(url);
                            if (enabled) setSettingValue("custom_avatar", true);
                          }}
                          onBannerUploaded={(url, enabled) => {
                            handleBannerUpdate(url);
                            if (enabled) setSettingValue("custom_banner", true);
                          }}
                          onUploadStateChange={setIsPreviewUploading}
                          onToggle={handleSettingChange}
                          togglesDisabled={isPreviewUploading}
                          accent={
                            userData.settings_v2?.colored_profile_cards === true
                              ? accentColor.accent
                              : null
                          }
                        />
                      )}
                      {listedSettings.map((entry) => {
                        const isHighlighted =
                          highlightSetting === entry.name && showHighlight;
                        const isAppearanceUploadBusy =
                          isPreviewUploading || isBackgroundUploading;
                        return (
                          <Fragment key={entry.name}>
                            {entry.name === "custom_background" &&
                              accentSetting}
                            <div
                              // Not rounded: the divider above is its top border, and a rounded
                              // corner would bend it.
                              className="transition-colors duration-500"
                              style={
                                isHighlighted
                                  ? {
                                      backgroundColor:
                                        "color-mix(in srgb, var(--color-button-info), transparent 88%)",
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
                                disabled={
                                  isAppearanceCat && isAppearanceUploadBusy
                                }
                                userData={userData}
                              />
                              {isAppearanceCat &&
                                entry.name === "custom_background" &&
                                entry.value && (
                                  <BackgroundSettings
                                    userData={userData}
                                    onUploadStateChange={
                                      setIsBackgroundUploading
                                    }
                                  />
                                )}
                            </div>
                          </Fragment>
                        );
                      })}
                      {!listedSettings.some(
                        (entry) => entry.name === "custom_background",
                      ) && accentSetting}
                    </div>
                  </SettingsCard>
                  {cat.name === "appearance" && displaySettings}
                </Fragment>
              );
            })}

            <SettingsCard
              id="notifications"
              title="Notification Preferences"
              icon={sectionIcon("notifications")}
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
              <div className={SETTINGS_LIST}>
                <DesktopNotificationToggle />
                <EmailNotificationSettings userData={userData} />

                <section>
                  <SettingsSubsectionHeading title="What to notify you about" />
                  <p className="text-secondary-text mb-3 text-sm">
                    Turn a whole group on or off, or open it to choose
                    individual notifications.
                  </p>

                  {notificationPrefsError && (
                    <p
                      className={`mb-2 text-sm ${
                        notificationPrefsError === "Authentication required"
                          ? "text-primary-text"
                          : "text-button-danger"
                      }`}
                    >
                      {notificationPrefsError === "Authentication required"
                        ? "Try refreshing the page."
                        : notificationPrefsError}
                    </p>
                  )}

                  {notificationPrefsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="bg-tertiary-bg h-12 animate-pulse rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    notificationPrefs && (
                      <NotificationTypeSettings
                        prefs={notificationPrefs}
                        saving={notificationPrefsSaving}
                        onToggle={handleNotificationPrefToggle}
                        highlight={showHighlight ? highlightSetting : null}
                        userData={userData}
                      />
                    )
                  )}
                </section>
              </div>
            </SettingsCard>

            <SettingsCard
              id="connections"
              title="Connections"
              icon={sectionIcon("connections")}
              isOwner={
                userData.flags?.some((f) => f.flag === "is_owner") ?? false
              }
              highlightStyle={getSectionHighlightStyle("connections")}
              scrollRef={(el) =>
                scrollHighlightedSectionIntoView("connections", el)
              }
              onCopyLink={() => copySectionLink("connections", "Connections")}
            >
              <div className={SETTINGS_LIST}>
                <RobloxConnection userData={userData} />
                <EmailConnection userData={userData} />
              </div>
            </SettingsCard>

            <SettingsCard
              id="export"
              title="Export Data"
              icon={sectionIcon("export")}
              isOwner={
                userData.flags?.some((f) => f.flag === "is_owner") ?? false
              }
              highlightStyle={getSectionHighlightStyle("export")}
              scrollRef={(el) => scrollHighlightedSectionIntoView("export", el)}
              onCopyLink={() => copySectionLink("export", "Export Data")}
            >
              <ExportInventoryData robloxId={userData.roblox_id} />
            </SettingsCard>

            {hasSupporterHistory ? (
              <SettingsCard
                id="supporter-history"
                title="Supporter History"
                icon={sectionIcon("supporter-history")}
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
                  <p>Previous supporter tiers recorded on your account.</p>
                }
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
              icon={sectionIcon("gifts")}
              isOwner={
                userData.flags?.some((f) => f.flag === "is_owner") ?? false
              }
              highlightStyle={getSectionHighlightStyle("gifts")}
              scrollRef={(el) => scrollHighlightedSectionIntoView("gifts", el)}
              onCopyLink={() => copySectionLink("gifts", "Purchased Gifts")}
              headerAccessory={
                <>
                  <p>Supporter gifts purchased on your account.</p>
                </>
              }
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
              icon={sectionIcon("danger")}
              isOwner={
                userData.flags?.some((f) => f.flag === "is_owner") ?? false
              }
              highlightStyle={getSectionHighlightStyle("danger")}
              scrollRef={(el) => scrollHighlightedSectionIntoView("danger", el)}
              onCopyLink={() => copySectionLink("danger", "Danger Zone")}
              variant="danger"
            >
              <div className={SETTINGS_LIST}>
                <div
                  id="inventory-data-deletion"
                  className="-mx-3 scroll-mt-24 rounded-lg px-3 transition-colors duration-500"
                  style={getSectionHighlightStyle("inventory-data-deletion")}
                  ref={(el) =>
                    scrollHighlightedSectionIntoView(
                      "inventory-data-deletion",
                      el,
                    )
                  }
                >
                  <DeleteInventoryData
                    robloxId={userData.roblox_id}
                    onCopyLink={
                      userData.flags?.some((f) => f.flag === "is_owner")
                        ? () =>
                            copySectionLink(
                              "inventory-data-deletion",
                              "Inventory Data Deletion",
                            )
                        : undefined
                    }
                  />
                </div>
                <div
                  id="account-deletion"
                  className="-mx-3 scroll-mt-24 rounded-lg px-3 transition-colors duration-500"
                  style={getSectionHighlightStyle("account-deletion")}
                  ref={(el) =>
                    scrollHighlightedSectionIntoView("account-deletion", el)
                  }
                >
                  <DeleteAccount
                    onCopyLink={
                      userData.flags?.some((f) => f.flag === "is_owner")
                        ? () =>
                            copySectionLink(
                              "account-deletion",
                              "Account Deletion",
                            )
                        : undefined
                    }
                  />
                </div>
              </div>
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
