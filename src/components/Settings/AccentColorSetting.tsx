"use client";

import { FRONTEND_SETTINGS } from "@/config/settings";

import { useId } from "react";
import SupporterModal from "@/components/Modals/SupporterModal";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { useQuery } from "@tanstack/react-query";
import { getProfileBanner } from "@/components/Profile/Banner";
import { appearanceProfileKey } from "@/hooks/useAccentColor";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import type { UserData } from "@/types/auth";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { UserAvatar } from "@/utils/ui/avatar";
import {
  ACCENT_STYLES,
  accentCardTheme,
  type Accent,
  type AccentStyle,
} from "@/utils/ui/accentColor";
import { AccentFillPicker } from "@/components/Settings/ColorFillPickers";

const DEFAULT_COLOR = "#2462cd";

const STYLE_NAMES: Record<AccentStyle, string> = {
  solid: "Solid",
  glass: "Glass",
  transparent: "Transparent",
};

interface AccentColorSettingProps {
  /** The accent the profile shows right now, or null if none. */
  accent: Accent | null;
  /** Only the custom accent; null means the Discord color is in use. */
  customAccent: Accent | null;
  onChange: (accent: Accent) => void;
  onReset: () => void;
  userData: UserData;
}

export function AccentColorSetting({
  accent,
  customAccent,
  onChange,
  onReset,
  userData,
}: AccentColorSettingProps) {
  const id = useId();
  const premiumType = userData.premiumtype ?? 0;
  const { modalState, closeModal, checkAccentColorAccess } =
    useSupporterModal();
  const canEdit = () => checkAccentColorAccess(premiumType);
  // The style previews show the user's own banner, avatar and name. /v2/users/me
  // has no custom banner, so read the public profile (shared with the preview).
  const { data: profile } = useQuery({
    queryKey: appearanceProfileKey(userData.id),
    queryFn: () =>
      fetchUserById(userData.id, PUBLIC_API_URL) as Promise<{
        avatar?: string | null;
        banner?: string | null;
        custom_avatar?: string | null;
        custom_banner?: string | null;
      }>,
    staleTime: 60_000,
  });
  const banner = getProfileBanner({
    userId: userData.id,
    banner: profile?.banner ?? userData.banner,
    customBanner: profile?.custom_banner ?? userData.custom_banner,
    settings: userData.settings_v2,
    premiumType,
    size: 600,
  });
  const name =
    userData.global_name && userData.global_name !== "None"
      ? userData.global_name
      : userData.username;
  const current = accent ?? {
    color: DEFAULT_COLOR,
    gradient: null,
    style: "solid" as const,
  };
  const update = (patch: Partial<Accent>) => onChange({ ...current, ...patch });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-primary-text text-base font-medium">
          {FRONTEND_SETTINGS["accent-color"].title}
        </p>
        <p className="text-secondary-text text-sm">
          Choose the color and style of your profile cards.{" "}
          {customAccent
            ? "Using your custom color."
            : "Using your Discord color."}
          {customAccent && (
            <>
              {" "}
              <button
                type="button"
                onClick={onReset}
                className="text-link hover:text-link-hover cursor-pointer underline-offset-4 hover:underline"
              >
                Reset to Discord color
              </button>
            </>
          )}
        </p>
      </div>

      <AccentFillPicker
        value={current}
        onChange={(fill) => update(fill)}
        canEdit={canEdit}
      />

      <fieldset>
        <legend className="text-primary-text mb-2 text-sm font-medium">
          Card style
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ACCENT_STYLES.map((style) => (
            <label
              key={style}
              className="group border-border-card has-checked:border-button-info has-focus-visible:ring-border-focus hover:border-border-focus/60 cursor-pointer overflow-hidden rounded-lg border transition-colors has-focus-visible:ring-2"
            >
              <input
                type="radio"
                name={`${id}-style`}
                value={style}
                checked={current.style === style}
                onChange={() => canEdit() && update({ style })}
                className="sr-only"
              />
              {/* Your own card in this style, over your banner. */}
              <span
                aria-hidden="true"
                data-accent-cards={style}
                style={accentCardTheme({ ...current, style })}
                className="relative flex h-20 items-end p-2"
              >
                <Image
                  placeholder={IMAGE_PLACEHOLDER}
                  src={banner.primary ?? banner.fallback}
                  alt=""
                  fill
                  sizes="200px"
                  draggable={false}
                  className="object-cover"
                />
                <span className="bg-secondary-bg border-border-card relative flex w-full min-w-0 items-center gap-1.5 rounded-md border p-1.5">
                  <UserAvatar
                    userId={userData.id}
                    avatarHash={profile?.avatar ?? userData.avatar}
                    username={userData.username}
                    size={5}
                    custom_avatar={
                      (profile?.custom_avatar ?? userData.custom_avatar) ||
                      undefined
                    }
                    settings={userData.settings_v2}
                    premiumType={premiumType}
                    showBadge={false}
                  />
                  <span className="text-primary-text truncate text-xs font-semibold">
                    {name}
                  </span>
                </span>
              </span>
              <span className="border-border-card group-has-checked:bg-button-info/10 flex items-center justify-between gap-2 border-t px-2.5 py-1.5">
                <span className="text-primary-text text-sm">
                  {STYLE_NAMES[style]}
                </span>
                <span
                  aria-hidden="true"
                  className="border-secondary-text group-has-checked:border-button-info group-has-checked:bg-button-info size-3.5 shrink-0 rounded-full border-2 transition-colors group-has-checked:shadow-[inset_0_0_0_2px_var(--color-secondary-bg)]"
                />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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
  );
}
