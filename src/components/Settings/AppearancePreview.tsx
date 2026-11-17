"use client";

import { Banner } from "@/components/Profile/Banner";
import {
  AvatarEditOverlay,
  BannerEditOverlay,
} from "@/components/Profile/EditableProfileImages";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { UserData, UserSettingsV2 } from "@/types/auth";
import { accentCardTheme, type Accent } from "@/utils/ui/accentColor";
import { UserAvatar } from "@/utils/ui/avatar";

interface AppearancePreviewProps {
  userData: UserData;
  /** Current toggle values, so the preview reflects them live. */
  customAvatarOn: boolean;
  customBannerOn: boolean;
  onAvatarUploaded: (url: string, displayEnabled: boolean) => void;
  onBannerUploaded: (url: string, displayEnabled: boolean) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  onToggle: (name: "custom_avatar" | "custom_banner", value: boolean) => void;
  togglesDisabled?: boolean;
  /** Accent to theme the card with, from useAccentColor. */
  accent?: Accent | null;
}

/**
 * A mini profile header: shows how the banner, avatar and accent color look,
 * uploads on click, and holds the custom banner/avatar toggles.
 */
export function AppearancePreview({
  userData,
  customAvatarOn,
  customBannerOn,
  onAvatarUploaded,
  onBannerUploaded,
  onUploadStateChange,
  onToggle,
  togglesDisabled,
  accent,
}: AppearancePreviewProps) {
  const settings = {
    ...userData.settings,
    custom_avatar: customAvatarOn,
    custom_banner: customBannerOn,
  } as UserSettingsV2;

  return (
    <div
      className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border"
      data-accent-cards={accent?.style}
      style={accent ? accentCardTheme(accent) : undefined}
    >
      <div id="custom_banner" className="relative scroll-mt-24">
        <Banner
          preview
          userId={userData.id}
          username={userData.username}
          bannerUrl={userData.banner_url}
        />
        <BannerEditOverlay
          userData={userData}
          onUploaded={onBannerUploaded}
          onUploadStateChange={onUploadStateChange}
        />
      </div>
      <div className="flex items-end gap-4 px-5 pb-4">
        <div
          id="custom_avatar"
          className={cn(
            "bg-secondary-bg relative z-30 -mt-10 shrink-0 p-1",
            userData.premiumtype === 3 ? "rounded-[20px]" : "rounded-full",
          )}
        >
          <UserAvatar
            userId={userData.id}
            avatarUrl={userData.avatar_url}
            username={userData.username}
            size={20}
            settings={settings}
            premiumType={userData.premiumtype}
            showBadge={false}
          />
          <AvatarEditOverlay
            userData={userData}
            onUploaded={onAvatarUploaded}
            onUploadStateChange={onUploadStateChange}
            iconClassName="size-6"
          />
        </div>
        <div className="min-w-0 pb-1">
          <p className="text-primary-text truncate text-lg font-semibold">
            {userData.global_name && userData.global_name !== "None"
              ? userData.global_name
              : userData.username}
          </p>
          <p className="text-secondary-text truncate text-sm">
            @{userData.username}
          </p>
        </div>
      </div>
      <div className="border-border-card flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-secondary-text text-xs">
          Click your banner or avatar to upload a new one.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(
            [
              ["custom_banner", "Custom banner", customBannerOn],
              ["custom_avatar", "Custom avatar", customAvatarOn],
            ] as const
          ).map(([name, label, checked]) => (
            <div key={name} className="flex items-center gap-2">
              <Switch
                id={`appearance-${name}`}
                checked={checked}
                onCheckedChange={(value) => onToggle(name, value)}
                disabled={togglesDisabled}
              />
              <label
                htmlFor={`appearance-${name}`}
                className="text-primary-text cursor-pointer text-sm font-medium"
              >
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
