import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

import {
  AvatarUploadDialog,
  getImageUploadRequirements,
} from "@/components/Settings/AvatarUploadDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { cn } from "@/lib/utils";
import { fetchCustomAvatar } from "@/services/settingsService";
import type { UserData } from "@/types/auth";

interface AvatarSettingsProps {
  userData: UserData;
  onAvatarUpdate: (newAvatarUrl: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export const AvatarSettings = ({
  userData,
  onAvatarUpdate,
  onUploadStateChange,
}: AvatarSettingsProps) => {
  const queryClient = useQueryClient();
  const avatarKey = ["custom-avatar", userData.id] as const;
  const avatarQuery = useQuery({
    queryKey: avatarKey,
    queryFn: fetchCustomAvatar,
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const customAvatarUrl = avatarQuery.data ?? null;
  const avatarError = avatarQuery.error?.message ?? null;
  const isLoadingAvatar = avatarQuery.isPending;
  const supporterTier = userData.premiumtype ?? 0;
  const usesSquareAvatar = supporterTier === 3;

  return (
    <div className="mt-3 mb-5">
      <p className="text-secondary-text mb-3 text-xs">
        {getImageUploadRequirements("avatar")}
      </p>

      <AvatarUploadDialog
        userData={userData}
        onUploadStateChange={onUploadStateChange}
        onUploaded={(url) => {
          queryClient.setQueryData(avatarKey, url);
          onAvatarUpdate(url);
        }}
      >
        {(openFilePicker, isUploading) => (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "border-border-card bg-tertiary-bg relative size-16 shrink-0 overflow-hidden border",
                usesSquareAvatar ? "rounded-sm" : "rounded-full",
              )}
            >
              {customAvatarUrl ? (
                <ImageLightbox
                  src={customAvatarUrl}
                  alt="Your saved custom avatar"
                  compact
                  previewRadius={
                    usesSquareAvatar ? "rounded-sm" : "rounded-full"
                  }
                  className="absolute inset-0"
                >
                  <Image
                    src={customAvatarUrl}
                    alt="Your saved custom avatar"
                    fill
                    sizes="64px"
                    unoptimized
                    className="object-cover"
                  />
                </ImageLightbox>
              ) : (
                <Icon
                  icon={
                    isLoadingAvatar
                      ? "svg-spinners:ring-resize"
                      : "heroicons:user"
                  }
                  className="text-secondary-text absolute inset-0 m-auto size-7"
                />
              )}
            </div>

            <Button onClick={openFilePicker} disabled={isUploading}>
              <Icon icon="material-symbols:cloud-upload" />
              {isUploading ? "Uploading..." : "Change Avatar"}
            </Button>
          </div>
        )}
      </AvatarUploadDialog>

      {avatarError && (
        <p className="text-button-danger mt-2 text-xs">{avatarError}</p>
      )}
    </div>
  );
};
