"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Banner } from "@/components/Profile/Banner";
import {
  AvatarEditOverlay,
  BannerEditOverlay,
} from "@/components/Profile/EditableProfileImages";
import { Switch } from "@/components/ui/switch";
import { appearanceProfileKey } from "@/hooks/useAccentColor";
import { cn } from "@/lib/utils";
import type { UserData, UserSettingsV2 } from "@/types/auth";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { accentCardTheme } from "@/utils/ui/accentColor";
import { UserAvatar } from "@/utils/ui/avatar";

interface PublicProfile {
  avatar?: string | null;
  banner?: string | null;
  custom_avatar?: string | null;
  custom_banner?: string | null;
}

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
  /** Accent color to theme the card with, from useAccentColor. */
  accent?: string | null;
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
  const queryClient = useQueryClient();
  // /v2/users/me has no custom banner and pre-resolves the avatar, so read the
  // raw images and effective accent color from the public profile instead.
  const profileKey = appearanceProfileKey(userData.id);
  const { data: profile } = useQuery({
    queryKey: profileKey,
    queryFn: () =>
      fetchUserById(userData.id, PUBLIC_API_URL) as Promise<PublicProfile>,
    staleTime: 60_000,
  });
  const updateProfile = (patch: Partial<PublicProfile>) =>
    queryClient.setQueryData<PublicProfile>(profileKey, (current) =>
      current ? { ...current, ...patch } : current,
    );

  const settings = {
    ...userData.settings_v2,
    custom_avatar: customAvatarOn,
    custom_banner: customBannerOn,
  } as UserSettingsV2;

  return (
    <div
      className="border-border-card bg-secondary-bg mb-5 overflow-hidden rounded-xl border"
      data-accent-cards={accent ? "" : undefined}
      style={accent ? accentCardTheme(accent) : undefined}
    >
      <div className="relative">
        <Banner
          userId={userData.id}
          username={userData.username}
          banner={(profile?.banner ?? userData.banner) || undefined}
          customBanner={
            (profile?.custom_banner ?? userData.custom_banner) || undefined
          }
          settings={settings}
          premiumType={userData.premiumtype}
          className="h-28 md:h-40"
        />
        <BannerEditOverlay
          userData={userData}
          onUploaded={(url, enabled) => {
            updateProfile({ custom_banner: url });
            onBannerUploaded(url, enabled);
          }}
          onUploadStateChange={onUploadStateChange}
        />
      </div>
      <div className="flex items-end gap-4 px-5 pb-4">
        <div
          className={cn(
            "bg-secondary-bg relative z-30 -mt-10 shrink-0 p-1",
            userData.premiumtype === 3 ? "rounded-[20px]" : "rounded-full",
          )}
        >
          <UserAvatar
            userId={userData.id}
            avatarHash={profile?.avatar ?? userData.avatar}
            username={userData.username}
            size={20}
            custom_avatar={
              (profile?.custom_avatar ?? userData.custom_avatar) || undefined
            }
            settings={settings}
            premiumType={userData.premiumtype}
            showBadge={false}
          />
          <AvatarEditOverlay
            userData={userData}
            onUploaded={(url, enabled) => {
              updateProfile({ custom_avatar: url });
              onAvatarUploaded(url, enabled);
            }}
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
