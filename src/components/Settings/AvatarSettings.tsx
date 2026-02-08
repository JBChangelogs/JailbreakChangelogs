import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Box, TextField, Typography } from "@mui/material";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/components/ui/IconWrapper";
import { UserData } from "@/types/auth";
import { updateAvatar, updateSettings } from "@/services/settingsService";
import { toast } from "sonner";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "../Modals/SupporterModal";
import { UPLOAD_CONFIG } from "@/config/settings";
import { validateFile } from "@/utils/fileValidation";

interface AvatarSettingsProps {
  userData: UserData;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export const AvatarSettings = ({
  userData,
  onAvatarUpdate,
}: AvatarSettingsProps) => {
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isValidAvatar, setIsValidAvatar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supporter modal hook
  const { modalState, closeModal, checkAvatarAccess } = useSupporterModal();

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
      console.error("Error validating avatar:", error);
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
        await updateSettings({
          ...userData.settings,
          avatar_discord: 0,
        });
        onAvatarUpdate(result.imageUrl);

        if (typeof window !== "undefined" && window.umami) {
          window.umami.track("Custom Avatar Uploaded", {
            url: result.imageUrl,
          });
        }
      } catch (saveError) {
        console.warn("Auto-save failed after upload:", saveError);
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
      console.error("Avatar upload error:", error);
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
      // Include all current settings when updating
      await updateSettings({
        ...userData.settings,
        avatar_discord: 0,
      });
      onAvatarUpdate(newAvatarUrl);
      toast.success("Custom avatar updated successfully");

      // Track avatar URL update
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Custom Avatar Updated", { url: customAvatarUrl });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      setAvatarError(
        error instanceof Error ? error.message : "Failed to update avatar",
      );
      toast.error("Failed to update avatar");
    }
  };

  return (
    <>
      <Box sx={{ mt: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ color: "var(--color-primary-text)" }}
          >
            Custom Avatar URL
          </Typography>
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
        </Box>
        <Typography
          variant="body2"
          sx={{
            mb: 1,
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
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            alignItems: { xs: "stretch", sm: "flex-start" },
          }}
        >
          <Box sx={{ flex: 1, mb: { xs: 1, sm: 0 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder={
                userData?.premiumtype && userData.premiumtype >= 2
                  ? "Your custom avatar URL here"
                  : "Supporter Tier 2 feature - Upgrade to unlock"
              }
              value={customAvatarUrl}
              onChange={handleCustomAvatarChange}
              variant="outlined"
              disabled={!userData?.premiumtype || userData.premiumtype < 2}
              error={!!avatarError}
              helperText={avatarError}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "var(--color-border-primary)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--color-button-info)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--color-button-info)",
                    borderWidth: "1px",
                  },
                  backgroundColor: "var(--color-tertiary-bg)",
                  height: "40px",
                },
                "& .MuiInputBase-input": {
                  color: "var(--color-primary-text)",
                  "&::placeholder": {
                    color: "var(--color-tertiary-text)",
                    opacity: 1,
                  },
                },
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "var(--color-primary-text) !important",
                  WebkitTextFillColor: "var(--color-primary-text) !important",
                  cursor: "not-allowed",
                  "&::placeholder": {
                    color: "var(--color-tertiary-text) !important",
                    opacity: 1,
                  },
                },
                "& .MuiFormHelperText-root": {
                  marginTop: "4px",
                  color: "var(--color-button-danger) !important",
                },
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Button
              variant="default"
              size="md"
              asChild
              className={cn(
                "min-w-full flex-1 sm:min-w-[120px] sm:flex-none",
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
                "min-w-full flex-1 sm:min-w-[100px] sm:flex-none",
                (!userData?.premiumtype || userData.premiumtype < 2) &&
                  "opacity-50",
              )}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Box>

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
