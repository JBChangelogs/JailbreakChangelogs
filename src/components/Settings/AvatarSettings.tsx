import { useEffect, useState } from "react";
import Image from "next/image";

import { AvatarUploadDialog } from "@/components/Settings/AvatarUploadDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { cn } from "@/lib/utils";
import { createLogger } from "@/services/logger";
import { fetchCustomAvatar } from "@/services/settingsService";
import type { UserData } from "@/types/auth";

const log = createLogger("UI");

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
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);
  const supporterTier = userData.premiumtype ?? 0;
  const usesSquareAvatar = supporterTier === 3;

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        setIsLoadingAvatar(true);
        setAvatarError(null);
        setCustomAvatarUrl(await fetchCustomAvatar());
      } catch (error) {
        log.error("Error loading custom avatar:", error);
        setAvatarError(
          error instanceof Error
            ? error.message
            : "Failed to load your custom avatar",
        );
      } finally {
        setIsLoadingAvatar(false);
      }
    };

    void loadAvatar();
  }, []);

  return (
    <div className="mt-3 mb-5">
      <p className="text-secondary-text mb-3 text-xs">
        PNG, JPG, WebP, or GIF up to 8 MB.
      </p>

      <AvatarUploadDialog
        userData={userData}
        onUploadStateChange={onUploadStateChange}
        onUploaded={(url) => {
          setCustomAvatarUrl(url);
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
