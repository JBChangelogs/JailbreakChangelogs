import { useState, useEffect, useCallback, useRef } from "react";
import { Box, TextField, Button, Typography, Chip } from "@mui/material";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { TrophyIcon } from "@heroicons/react/24/solid";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { UserData } from "@/types/auth";
import { updateAvatar } from "@/services/settingsService";
import toast from "react-hot-toast";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "../Modals/SupporterModal";
import { UPLOAD_CONFIG } from "@/config/settings";
import { validateFile } from "@/utils/media/fileValidation";

interface AvatarSettingsProps {
  userData: UserData;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export const AvatarSettings = ({
  userData,
  onAvatarUpdate,
}: AvatarSettingsProps) => {
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
    if (userData?.custom_avatar) {
      setCustomAvatarUrl(userData.custom_avatar);
      validateAvatarUrl(userData.custom_avatar);
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

    // Client-side validation with helpful warnings
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

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/vgy", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // If it's an authentication error, suggest using direct URLs
        if (response.status === 401) {
          throw new Error(
            "File upload is not available. Please use a direct image URL from ImgBB, PostImg, or other image hosting services.",
          );
        }
        throw new Error(result.message || "Upload failed");
      }

      // Auto-fill the URL field with uploaded image
      setCustomAvatarUrl(result.imageUrl);
      validateAvatarUrl(result.imageUrl);

      // Auto-save the avatar immediately
      try {
        await updateAvatar(result.imageUrl);
        onAvatarUpdate(result.imageUrl);
        toast.success("Avatar updated successfully!", {
          duration: 3000,
        });
      } catch {
        toast.success(
          'Image uploaded! URL has been added to the form. Click "Update" to set as avatar.',
          {
            duration: 4000,
          },
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      setAvatarError(errorMessage);
      toast.error(errorMessage);

      // Reset file input to allow selecting the same file again
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
      // Update the avatar URL - this endpoint should handle both the URL update and settings change
      const newAvatarUrl = await updateAvatar(customAvatarUrl);
      onAvatarUpdate(newAvatarUrl);
      toast.success("Custom avatar updated successfully");
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
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ color: "var(--color-primary-text)" }}
          >
            Custom Avatar URL
          </Typography>
          <Tooltip
            title="Supporter Tier 2 Feature"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-tertiary-bg)",
                  color: "var(--color-primary-text)",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  boxShadow: "var(--color-card-shadow)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-tertiary-bg)",
                  },
                },
              },
            }}
          >
            <Chip
              icon={
                <TrophyIcon
                  className="h-4 w-4"
                  style={{ color: "var(--color-primary-text)" }}
                />
              }
              label="Supporter Tier 2"
              size="small"
              variant="outlined"
              sx={{
                borderColor: "var(--color-primary-text)",
                color: "var(--color-primary-text)",
                fontSize: "0.75rem",
                backgroundColor: "transparent",
                "& .MuiChip-label": {
                  fontWeight: 600,
                },
              }}
            />
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
                  ? "https://example.com/your-avatar.jpg"
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
                  "& fieldset": {},
                  "&:hover fieldset": {
                    borderColor: "var(--color-button-info)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--color-button-info)",
                  },
                  backgroundColor: "var(--color-secondary-bg)",
                  height: "40px",
                },
                "& .MuiInputBase-input": {
                  color: "var(--color-primary-text)",
                },
                "& .MuiInputBase-input.Mui-disabled": {
                  color: "var(--color-primary-text) !important",
                  WebkitTextFillColor: "var(--color-primary-text) !important",
                  cursor: "not-allowed",
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
              variant="contained"
              size="small"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={
                !userData?.premiumtype ||
                userData.premiumtype < 2 ||
                isUploading
              }
              className={isUploading ? "cursor-progress" : "cursor-pointer"}
              sx={{
                backgroundColor: "var(--color-button-info)",
                color: "var(--color-form-button-text)",
                "&:hover": {
                  backgroundColor: "var(--color-button-info-hover)",
                },
                "&.Mui-disabled": {
                  color: "var(--color-form-button-text)",
                },
                height: "40px",
                minWidth: { xs: "100%", sm: "120px" },
                flex: { xs: 1, sm: "none" },
              }}
            >
              {isUploading ? "Uploading..." : "Upload File"}
              <input
                ref={fileInputRef}
                type="file"
                accept={UPLOAD_CONFIG.ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleUpdateAvatar}
              disabled={
                !isValidAvatar ||
                !userData?.premiumtype ||
                userData.premiumtype < 2 ||
                isUploading
              }
              sx={{
                backgroundColor: "var(--color-button-info)",
                color: "var(--color-form-button-text)",
                "&:hover": {
                  backgroundColor: "var(--color-button-info-hover)",
                },
                "&.Mui-disabled": {
                  color: "var(--color-form-button-text)",
                },
                height: "40px",
                minWidth: { xs: "100%", sm: "100px" },
                flex: { xs: 1, sm: "none" },
              }}
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
