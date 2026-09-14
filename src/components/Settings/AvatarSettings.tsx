import { useEffect, useState } from "react";
import Image from "next/image";

import { AvatarUploadDialog } from "@/components/Settings/AvatarUploadDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const hasAvatarAccess = supporterTier >= 2 && supporterTier <= 3;
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
    <div className="mt-4 mb-6">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-primary-text text-base font-medium">
          Custom Avatar
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Image
              src="https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_2.svg"
              alt="Supporter Tier II"
              width={24}
              height={24}
              className="cursor-pointer object-contain hover:opacity-90"
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Supporter Tier II</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <p
        className={cn(
          "mb-3 text-sm",
          hasAvatarAccess ? "text-secondary-text" : "text-button-danger",
        )}
      >
        {hasAvatarAccess
          ? "Choose an image, crop it, and upload it. PNG, JPG, WebP, or GIF up to 8 MB."
          : "🔒 Upgrade to Supporter Tier 2 to unlock custom avatars"}
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
                <Image
                  src={customAvatarUrl}
                  alt="Your saved custom avatar"
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-cover"
                />
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

            <Button
              onClick={openFilePicker}
              disabled={isUploading}
              className={cn(!hasAvatarAccess && "opacity-50")}
            >
              <Icon icon="material-symbols:cloud-upload" />
              {isUploading
                ? "Uploading..."
                : customAvatarUrl
                  ? "Choose New Image"
                  : "Choose Image"}
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
