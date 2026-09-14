import { useEffect, useState } from "react";
import Image from "next/image";

import { BannerUploadDialog } from "@/components/Settings/AvatarUploadDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createLogger } from "@/services/logger";
import { fetchCustomBanner } from "@/services/settingsService";
import type { UserData } from "@/types/auth";

const log = createLogger("UI");

interface BannerSettingsProps {
  userData: UserData;
  onBannerUpdate: (newBannerUrl: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export const BannerSettings = ({
  userData,
  onBannerUpdate,
  onUploadStateChange,
}: BannerSettingsProps) => {
  const [customBannerUrl, setCustomBannerUrl] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const supporterTier = userData.premiumtype ?? 0;
  const hasBannerAccess = supporterTier >= 2 && supporterTier <= 3;

  useEffect(() => {
    const loadBanner = async () => {
      try {
        setIsLoadingBanner(true);
        setBannerError(null);
        setCustomBannerUrl(await fetchCustomBanner());
      } catch (error) {
        log.error("Error loading custom banner:", error);
        setBannerError(
          error instanceof Error
            ? error.message
            : "Failed to load your custom banner",
        );
      } finally {
        setIsLoadingBanner(false);
      }
    };

    void loadBanner();
  }, []);

  return (
    <div className="mt-4 mb-6">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-primary-text text-base font-medium">
          Custom Banner
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
          hasBannerAccess ? "text-secondary-text" : "text-button-danger",
        )}
      >
        {hasBannerAccess
          ? "Choose an image, adjust it, and upload it. PNG, JPG, WebP, or GIF up to 10 MB."
          : "🔒 Upgrade to Supporter Tier 2 to unlock custom banners"}
      </p>

      <BannerUploadDialog
        userData={userData}
        onUploadStateChange={onUploadStateChange}
        onUploaded={(url) => {
          setCustomBannerUrl(url);
          onBannerUpdate(url);
        }}
      >
        {(openFilePicker, isUploading) => (
          <div className="space-y-3">
            <div className="border-border-card bg-tertiary-bg relative aspect-3/1 w-full max-w-md overflow-hidden rounded-lg border">
              {customBannerUrl ? (
                <Image
                  src={customBannerUrl}
                  alt="Your saved custom banner"
                  fill
                  sizes="448px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <Icon
                  icon={
                    isLoadingBanner
                      ? "svg-spinners:ring-resize"
                      : "heroicons:photo"
                  }
                  className="text-secondary-text absolute inset-0 m-auto size-8"
                />
              )}
            </div>

            <Button
              onClick={openFilePicker}
              disabled={isUploading}
              className={cn(!hasBannerAccess && "opacity-50")}
            >
              <Icon icon="material-symbols:cloud-upload" />
              {isUploading
                ? "Uploading..."
                : customBannerUrl
                  ? "Choose New Image"
                  : "Choose Image"}
            </Button>
          </div>
        )}
      </BannerUploadDialog>

      {bannerError && (
        <p className="text-button-danger mt-2 text-xs">{bannerError}</p>
      )}
    </div>
  );
};
