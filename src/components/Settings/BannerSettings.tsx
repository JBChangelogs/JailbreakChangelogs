import { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { UserData } from "@/types/auth";
import { updateBanner } from "@/services/settingsService";
import toast from "react-hot-toast";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "../Modals/SupporterModal";

interface BannerSettingsProps {
  userData: UserData;
  onBannerUpdate: (newBannerUrl: string) => void;
}

export const BannerSettings = ({
  userData,
  onBannerUpdate,
}: BannerSettingsProps) => {
  const [customBannerUrl, setCustomBannerUrl] = useState<string>("");
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isValidBanner, setIsValidBanner] = useState(false);

  // Supporter modal hook
  const {
    modalState,
    closeModal,
    checkBannerAccess,
    checkAnimatedBannerAccess,
  } = useSupporterModal();

  const validateBannerUrl = useCallback((url: string) => {
    setBannerError(null);
    setIsValidBanner(false);

    if (!url) return;

    try {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        setBannerError("Please enter a valid URL");
        return;
      }

      const allowedExtensions = [".jpeg", ".jpg", ".webp", ".gif", ".png"];
      const fileExtension = parsedUrl.pathname
        .substring(parsedUrl.pathname.lastIndexOf("."))
        .toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        setBannerError(`URL must end with ${allowedExtensions.join(", ")}`);
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
      ];

      const isAllowedHost = allowedHosts.some(
        (host) =>
          parsedUrl.hostname === host ||
          parsedUrl.hostname.endsWith("." + host),
      );

      if (!isAllowedHost) {
        setBannerError(
          `Only images from ${allowedHosts.filter((host) => !host.startsWith("i.")).join(", ")} are allowed`,
        );
        return;
      }

      setIsValidBanner(true);
    } catch (error) {
      console.error("Error validating banner:", error);
      setBannerError("Invalid banner URL");
    }
  }, []);

  useEffect(() => {
    if (userData?.custom_banner) {
      setCustomBannerUrl(userData.custom_banner);
      validateBannerUrl(userData.custom_banner);
    }
  }, [userData, validateBannerUrl]);

  const handleCustomBannerChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newUrl = event.target.value.trim();
    setCustomBannerUrl(newUrl);
    validateBannerUrl(newUrl);
  };

  const handleUpdateBanner = async () => {
    if (!customBannerUrl) return;

    // Check supporter tier access before proceeding
    if (!checkBannerAccess(userData.premiumtype || 0)) {
      return; // Modal will be shown by the hook
    }

    // Check for animated banner access if it's a GIF
    if (customBannerUrl.toLowerCase().includes(".gif")) {
      if (!checkAnimatedBannerAccess(userData.premiumtype || 0)) {
        return; // Modal will be shown by the hook
      }
    }

    if (!isValidBanner) return;

    try {
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("token="),
      );
      const token = tokenCookie ? tokenCookie.split("=")[1] : null;

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Update the banner URL
      const newBannerUrl = await updateBanner(customBannerUrl, token);
      onBannerUpdate(newBannerUrl);
      toast.success("Custom banner updated successfully");
    } catch (error) {
      console.error("Error updating banner:", error);
      setBannerError(
        error instanceof Error ? error.message : "Failed to update banner",
      );
      toast.error("Failed to update banner");
    }
  };

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ color: "#D3D9D4" }}
          >
            Custom Banner URL
          </Typography>
          <Tooltip title="Premium Feature">
            <Chip
              icon={<StarIcon sx={{ color: "#FFD700" }} />}
              label="Premium"
              size="small"
              sx={{
                backgroundColor: "rgba(255, 215, 0, 0.1)",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                color: "#FFD700",
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
              userData?.premiumtype && userData.premiumtype >= 2
                ? "#FFFFFF"
                : "#FF6B6B",
            fontWeight:
              userData?.premiumtype && userData.premiumtype >= 2
                ? "normal"
                : 500,
          }}
        >
          {userData?.premiumtype && userData.premiumtype >= 2
            ? "Enter a direct link to your custom banner image (ImgBB, PostImg, or Tenor only)"
            : "🔒 Upgrade to Premium Tier 2 to unlock custom banners"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={
                userData?.premiumtype && userData.premiumtype >= 2
                  ? "https://example.com/your-banner.jpg"
                  : "Premium feature - Upgrade to unlock"
              }
              value={customBannerUrl}
              onChange={handleCustomBannerChange}
              variant="outlined"
              disabled={!userData?.premiumtype || userData.premiumtype < 2}
              error={!!bannerError}
              helperText={bannerError}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#2E3944",
                  },
                  "&:hover fieldset": {
                    borderColor: "#124E66",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#124E66",
                  },
                  backgroundColor: "rgba(46, 57, 68, 0.5)",
                  height: "40px",
                },
                "& .MuiInputBase-input": {
                  color: "#D3D9D4",
                },
                "& .MuiFormHelperText-root": {
                  position: "absolute",
                  bottom: "-20px",
                },
              }}
            />
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleUpdateBanner}
            disabled={
              !isValidBanner ||
              !userData?.premiumtype ||
              userData.premiumtype < 2
            }
            sx={{
              backgroundColor: "#124E66",
              "&:hover": {
                backgroundColor: "#0D3A4D",
              },
              "&.Mui-disabled": {
                backgroundColor: "#2E3944",
                color: "#FFFFFF",
              },
              height: "40px",
              minWidth: "100px",
            }}
          >
            Update
          </Button>
        </Box>
        <Box sx={{ height: "40px" }} />
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
