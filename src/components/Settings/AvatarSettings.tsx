import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/components/ui/IconWrapper";
import { UserData } from "@/types/auth";
import { updateAvatar, updateUserSettings } from "@/services/settingsService";
import { toast } from "sonner";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "../Modals/SupporterModal";
import { UPLOAD_CONFIG } from "@/config/settings";
import { validateFile } from "@/utils/storage/fileValidation";
import { createLogger } from "@/services/logger";

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
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.com/assets/website_icons";
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isValidAvatar, setIsValidAvatar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supporter modal hook
  const { modalState, closeModal, checkAvatarAccess } = useSupporterModal();

  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  const validateAvatarUrl = useCallback((url: string) => {
    setAvatarError(null);
    setIsValidAvatar(false);

    if (!url) return;

    try {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        setAvatarError("Please enter a valid URL");
        return;
      }

      const allowedHosts = [
        "imgbb.com",
        "i.ibb.co",
        "postimg.cc",
        "i.postimg.cc",
        "tenor.com",
        "cdn.discordapp.com",
        "imgur.com",
        "i.imgur.com",
        "vgy.me",
        "i.vgy.me",
      ];

      const isAllowedHost = allowedHosts.some(
        (host) =>
          parsedUrl.hostname === host ||
          parsedUrl.hostname.endsWith("." + host),
      );

      if (!isAllowedHost) {
        setAvatarError(
          `Only images from ${allowedHosts.filter((host) => !host.startsWith("i.")).join(", ")} are allowed`,
        );
        return;
      }

      const fileExtension = parsedUrl.pathname
        .substring(parsedUrl.pathname.lastIndexOf("."))
        .toLowerCase();

      const allowedExtensions = [".jpeg", ".jpg", ".webp", ".png", ".gif"];
      if (!allowedExtensions.includes(fileExtension)) {
        setAvatarError(
          "Only .jpeg, .jpg, .webp, .png, and .gif files are allowed",
        );
        return;
      }

      setIsValidAvatar(true);
    } catch (error) {
      log.error("Error validating avatar:", error);
      setAvatarError("Invalid avatar URL");
    }
  }, []);

  useEffect(() => {
    if (userData?.custom_avatar && userData.custom_avatar !== "N/A") {
      setCustomAvatarUrl(userData.custom_avatar);
      validateAvatarUrl(userData.custom_avatar);
    } else {
      setCustomAvatarUrl("");
    }
  }, [userData, validateAvatarUrl]);

  const handleCustomAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newUrl = event.target.value.trim();
    setCustomAvatarUrl(newUrl);
    validateAvatarUrl(newUrl);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check supporter tier access before proceeding
    if (!checkAvatarAccess(userData.premiumtype || 0)) {
      return; // Modal will be shown by the hook
    }

    // Client-side validation
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const allowedMimeTypes = [...UPLOAD_CONFIG.ALLOWED_FILE_TYPES];

    const validation = validateFile(
      file,
      allowedExtensions,
      allowedMimeTypes,
      UPLOAD_CONFIG.MAX_FILE_SIZE,
      UPLOAD_CONFIG.MAX_FILE_SIZE_MB,
    );

    if (!validation.isValid) {
      setAvatarError(validation.error || "Invalid file");
      return;
    }

    setIsUploading(true);
    setAvatarError(null);

    const uploadAndSave = (async () => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/vgy", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "File upload is not available. Please use a direct link.",
          );
        }
        if (response.status === 408) {
          throw new Error("Upload timeout - please try a smaller file.");
        }
        throw new Error(result.message || "Upload failed");
      }

      // Update UI state
      setCustomAvatarUrl(result.imageUrl);
      validateAvatarUrl(result.imageUrl);

      // Perform auto-save
      try {
        await updateAvatar(result.imageUrl);
        await updateUserSettings("custom_avatar", true);
        onAvatarUpdate(result.imageUrl);

        if (typeof window !== "undefined" && window.umami) {
          window.umami.track("Custom Avatar Uploaded", {
            url: result.imageUrl,
          });
        }
      } catch (saveError) {
        log.warn("Auto-save failed after upload:", saveError);
      }

      return result.imageUrl;
    })();

    toast.promise(uploadAndSave, {
      loading: "Uploading your avatar...",
      success: {
        message: "Avatar updated successfully!",
        description: "Your new custom avatar is now active.",
      },
      error: (err) => ({
        message: "Upload failed",
        description:
          err instanceof Error
            ? err.message
            : "Please try again or use a direct URL.",
      }),
    });

    try {
      await uploadAndSave;
    } catch (error) {
      log.error("Avatar upload error:", error);
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!customAvatarUrl) return;

    // Check supporter tier access before proceeding
    if (!checkAvatarAccess(userData.premiumtype || 0)) {
      return; // Modal will be shown by the hook
    }

    if (!isValidAvatar) return;

    try {
      // Update the avatar URL and settings to use custom avatar instead of Discord
      const newAvatarUrl = await updateAvatar(customAvatarUrl);
      await updateUserSettings("custom_avatar", true);
      onAvatarUpdate(newAvatarUrl);
      toast.success("Custom avatar updated successfully");

      // Track avatar URL update
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Custom Avatar Updated", { url: customAvatarUrl });
      }
    } catch (error) {
      log.error("Error updating avatar:", error);
      setAvatarError(
        error instanceof Error ? error.message : "Failed to update avatar",
      );
      toast.error("Failed to update avatar");
    }
  };

  return (
    <>
      <div className="mt-4 mb-6">
        <div className="mb-2 flex items-center gap-2">
          <div className="text-primary-text text-base font-medium">
            Custom Avatar URL
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Image
                src={`${BADGE_BASE_URL}/jbcl_supporter_2.svg`}
                alt="Supporter Tier II"
                width={24}
                height={24}
                className="cursor-pointer object-contain hover:opacity-90"
              />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
            >
              <p>Supporter Tier II</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p
          className="mb-2 text-sm"
          style={{
            color:
              userData?.premiumtype &&
              userData.premiumtype >= 2 &&
              userData.premiumtype <= 3
                ? "var(--color-primary-text)"
                : "var(--color-button-danger)",
            fontWeight:
              userData?.premiumtype &&
              userData.premiumtype >= 2 &&
              userData.premiumtype <= 3
                ? "normal"
                : 500,
          }}
        >
          {userData?.premiumtype && userData.premiumtype >= 2
            ? "Upload an image file or enter a direct link to your image"
            : "🔒 Upgrade to Supporter Tier 2 to unlock custom avatars"}
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
          <div className="mb-2 flex-1 sm:mb-0">
            <input
              type="url"
              placeholder={
                userData?.premiumtype && userData.premiumtype >= 2
                  ? "Your custom avatar URL here"
                  : "Supporter Tier 2 feature - Upgrade to unlock"
              }
              value={customAvatarUrl}
              onChange={handleCustomAvatarChange}
              disabled={
                !userData?.premiumtype ||
                userData.premiumtype < 2 ||
                isUploading
              }
              className={cn(
                "border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text h-10 w-full rounded-md border px-3 text-sm transition-colors outline-none",
                "focus:border-button-info",
                (!userData?.premiumtype ||
                  userData.premiumtype < 2 ||
                  isUploading) &&
                  "cursor-not-allowed border-[color-mix(in_srgb,var(--color-border-card),white_12%)] bg-[color-mix(in_srgb,var(--color-tertiary-bg),black_12%)] opacity-70",
              )}
            />
            {avatarError && (
              <p className="text-button-danger mt-1 text-xs">{avatarError}</p>
            )}
          </div>
          <div className="flex w-full flex-row gap-2 sm:w-auto">
            <Button
              variant="default"
              size="md"
              asChild
              className={cn(
                "flex-1 sm:min-w-30 sm:flex-none",
                (!userData?.premiumtype ||
                  userData.premiumtype < 2 ||
                  isUploading) &&
                  "cursor-not-allowed opacity-50",
                isUploading ? "cursor-progress" : "cursor-pointer",
              )}
            >
              <label
                onClick={(e) => {
                  if (!userData?.premiumtype || userData.premiumtype < 2) {
                    e.preventDefault();
                    checkAvatarAccess(userData.premiumtype || 0);
                  }
                }}
              >
                <Icon
                  icon="material-symbols:cloud-upload"
                  className="h-5 w-5"
                />
                {isUploading ? "Uploading..." : "Upload File"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={UPLOAD_CONFIG.ALLOWED_FILE_TYPES.join(",")}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={
                    !userData?.premiumtype ||
                    userData.premiumtype < 2 ||
                    isUploading
                  }
                />
              </label>
            </Button>
            <Button
              variant="default"
              size="md"
              onClick={() => {
                if (!userData?.premiumtype || userData.premiumtype < 2) {
                  checkAvatarAccess(userData.premiumtype || 0);
                } else {
                  handleUpdateAvatar();
                }
              }}
              disabled={
                (userData?.premiumtype &&
                  userData.premiumtype >= 2 &&
                  !isValidAvatar) ||
                isUploading
              }
              className={cn(
                "flex-1 sm:min-w-25 sm:flex-none",
                (!userData?.premiumtype || userData.premiumtype < 2) &&
                  "opacity-50",
              )}
            >
              Update
            </Button>
          </div>
        </div>
      </div>

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
    </>
  );
};
