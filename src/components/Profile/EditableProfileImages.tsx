"use client";

import {
  AvatarUploadDialog,
  BannerUploadDialog,
} from "@/components/Settings/AvatarUploadDialog";
import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";
import type { UserSettingsV2 } from "@/types/auth";

interface EditOverlayProps {
  userData: { premiumtype?: number; settings_v2?: UserSettingsV2 };
  onUploaded: (url: string, displayEnabled: boolean) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}

/** Click-to-upload layer over a banner; place inside a `relative` box. */
export function BannerEditOverlay({
  userData,
  onUploaded,
  onUploadStateChange,
}: EditOverlayProps) {
  return (
    <BannerUploadDialog
      userData={userData}
      activateAfterUpload
      onUploaded={onUploaded}
      onUploadStateChange={onUploadStateChange}
    >
      {(openFilePicker, isUploading) => (
        <button
          type="button"
          onClick={openFilePicker}
          disabled={isUploading}
          aria-label={isUploading ? "Uploading banner" : "Change banner"}
          className="group/banner focus-visible:ring-border-focus absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/0 transition-colors hover:bg-black/40 focus-visible:bg-black/40 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset disabled:cursor-wait"
        >
          <span
            className={cn(
              "flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white opacity-0 transition-opacity group-hover/banner:opacity-100 group-focus-visible/banner:opacity-100",
              isUploading && "opacity-100",
            )}
          >
            <Icon
              icon={
                isUploading
                  ? "svg-spinners:ring-resize"
                  : "material-symbols:photo-camera"
              }
              className="size-4"
            />
            {isUploading ? "Uploading..." : "Change banner"}
          </span>
          {/* Always visible so touch users can tell it's editable. */}
          <span className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white">
            <Icon icon="material-symbols:photo-camera" className="size-4" />
          </span>
        </button>
      )}
    </BannerUploadDialog>
  );
}

/** Click-to-upload layer over an avatar; place inside the avatar's `relative` ring. */
export function AvatarEditOverlay({
  userData,
  onUploaded,
  onUploadStateChange,
  iconClassName = "size-7 md:size-9",
}: EditOverlayProps & { iconClassName?: string }) {
  return (
    <AvatarUploadDialog
      userData={userData}
      activateAfterUpload
      onUploaded={onUploaded}
      onUploadStateChange={onUploadStateChange}
    >
      {(openFilePicker, isUploading) => (
        <button
          type="button"
          onClick={openFilePicker}
          disabled={isUploading}
          aria-label={isUploading ? "Uploading avatar" : "Change avatar"}
          className={cn(
            "group/avatar focus-visible:ring-border-focus absolute inset-1 z-30 flex cursor-pointer items-center justify-center bg-black/0 text-white transition-colors hover:bg-black/45 focus-visible:bg-black/45 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait",
            userData.premiumtype === 3 ? "rounded-2xl" : "rounded-full",
          )}
        >
          <Icon
            icon={
              isUploading
                ? "svg-spinners:ring-resize"
                : "material-symbols:photo-camera"
            }
            className={cn(
              "opacity-0 transition-opacity group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100",
              iconClassName,
              isUploading && "opacity-100",
            )}
          />
        </button>
      )}
    </AvatarUploadDialog>
  );
}
