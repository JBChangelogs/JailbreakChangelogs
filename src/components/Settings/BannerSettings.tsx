import { useEffect, useState } from "react";
import Image from "next/image";

import { BannerUploadDialog } from "@/components/Settings/AvatarUploadDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
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
    <div className="mt-3 mb-5">
      <p className="text-secondary-text mb-3 text-xs">
        PNG, JPG, WebP, or GIF up to 10 MB.
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
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="border-border-card bg-tertiary-bg relative aspect-3/1 w-full max-w-60 flex-1 overflow-hidden rounded-lg border">
              {customBannerUrl ? (
                <ImageLightbox
                  src={customBannerUrl}
                  alt="Your saved custom banner"
                  className="absolute inset-0"
                >
                  <Image
                    src={customBannerUrl}
                    alt="Your saved custom banner"
                    fill
                    sizes="240px"
                    unoptimized
                    className="object-cover"
                  />
                </ImageLightbox>
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
              className="shrink-0"
            >
              <Icon icon="material-symbols:cloud-upload" />
              {isUploading ? "Uploading..." : "Change Banner"}
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
