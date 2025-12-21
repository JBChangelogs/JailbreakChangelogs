"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserData } from "@/types/auth";
import {
  Container,
  Typography,
  Box,
  FormGroup,
  Paper,
  Divider,
  Button,
  Skeleton,
} from "@mui/material";
import { settingsConfig, SettingKey } from "@/config/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingToggle } from "@/components/Settings/SettingToggle";
import { BannerSettings } from "@/components/Settings/BannerSettings";
import { AvatarSettings } from "@/components/Settings/AvatarSettings";
import { Icon } from "@/components/ui/IconWrapper";
import { DeleteAccount } from "@/components/Settings/DeleteAccount";
import { RobloxConnection } from "@/components/Settings/RobloxConnection";
import { ExportInventoryData } from "@/components/Settings/ExportInventoryData";
import { useAuthContext } from "@/contexts/AuthContext";
import SupporterModal from "@/components/Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { safeSetJSON } from "@/utils/safeStorage";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function SettingsPage() {
  const { user, isLoading } = useAuthContext();
  const { modalState, closeModal, openModal } = useSupporterModal();
  const router = useRouter();
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightSetting, setHighlightSetting] = useState<string | null>(null);

  // Derive state from props instead of setting in useEffect
  const userData = user;
  const loading = isLoading;

  useEffect(() => {
    // Check for highlight parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const highlight = urlParams.get("highlight");

    if (highlight) {
      // Use setTimeout to defer state updates
      const timer = setTimeout(() => {
        setHighlightSetting(highlight);
        setShowHighlight(true);

        // Clear highlight after 10 seconds
        const clearTimer = setTimeout(() => {
          setShowHighlight(false);
          setHighlightSetting(null);
          // Remove the highlight parameter from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }, 10000);

        return () => clearTimeout(clearTimer);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, []);

  const {
    settings,
    loading: settingsLoading,
    handleSettingChange,
  } = useSettings(userData, openModal);

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not authenticated and auth is not loading
      router.push("/");
    }
  }, [user, isLoading, router]);

  const handleBannerUpdate = (newBannerUrl: string) => {
    if (userData) {
      const updatedUser: UserData = {
        ...userData,
        custom_banner: newBannerUrl,
        settings: {
          ...userData.settings,
          banner_discord: 0, // Set to use custom banner
        },
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (userData) {
      const updatedUser: UserData = {
        ...userData,
        custom_avatar: newAvatarUrl,
        settings: {
          ...userData.settings,
          avatar_discord: 0, // Set to use custom avatar
        },
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );
    }
  };

  if (loading || settingsLoading) {
    return (
      <Container maxWidth="md" sx={{ minHeight: "100vh", py: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={300} height={24} sx={{ mb: 4 }} />

        {/* Privacy Settings Skeleton */}
        <Paper
          elevation={1}
          sx={{
            mb: 4,
            p: 3,
            backgroundColor: "var(--color-secondary-bg)",
            color: "var(--color-primary-text)",
          }}
        >
          <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Skeleton variant="rectangular" width={40} height={24} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="text" width="80%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Appearance Settings Skeleton */}
        <Paper
          elevation={1}
          sx={{
            mb: 4,
            p: 3,
            backgroundColor: "var(--color-secondary-bg)",
            color: "var(--color-primary-text)",
          }}
        >
          <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[1, 2].map((i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Skeleton variant="rectangular" width={40} height={24} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="text" width="80%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Account Management Skeleton */}
        <Paper
          elevation={1}
          sx={{
            mb: 4,
            p: 3,
            backgroundColor: "var(--color-secondary-bg)",
            color: "var(--color-primary-text)",
          }}
        >
          <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!userData || !settings) {
    return null;
  }

  const settingsByCategory: Record<string, string[]> = {};
  Object.keys(settings)
    .filter((key) => key !== "updated_at" && key in settingsConfig)
    .forEach((key) => {
      const config = settingsConfig[key as SettingKey];
      if (config && config.category !== "System") {
        const { category } = config;
        if (!settingsByCategory[category]) {
          settingsByCategory[category] = [];
        }
        settingsByCategory[category].push(key);
      }
    });

  return (
    <Container maxWidth="md" sx={{ minHeight: "100vh", py: 4 }}>
      <Box sx={{ mt: -2, mb: 0 }}>
        <Breadcrumb />
      </Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          mt: 0.5,
          color: "var(--color-primary-text)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon
          icon="material-symbols:settings"
          className="h-8 w-8"
          style={{ color: "var(--color-primary-text)" }}
        />
        Settings
      </Typography>
      <Typography
        variant="body1"
        sx={{ mb: 4, color: "var(--color-primary-text)" }}
      >
        Welcome to your settings page, {userData.username}!
      </Typography>

      {Object.entries(settingsByCategory).map(([category, settingKeys]) => {
        return (
          <Paper
            key={category}
            elevation={1}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{ fontWeight: "bold", color: "var(--color-primary-text)" }}
            >
              {category}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <FormGroup>
              {settingKeys.map((key) => {
                const typedKey = key as keyof typeof settings;
                const isHighlighted = highlightSetting === key && showHighlight;
                return (
                  <Box
                    key={key}
                    sx={{
                      ...(isHighlighted && {
                        backgroundColor:
                          "rgba(var(--color-button-info-rgb), 0.1)",
                        borderRadius: 1,
                        p: 1,
                        border: "1px solid var(--color-button-info)",
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%": {
                            boxShadow:
                              "0 0 0 0 rgba(var(--color-button-info-rgb), 0.4)",
                          },
                          "70%": {
                            boxShadow:
                              "0 0 0 10px rgba(var(--color-button-info-rgb), 0)",
                          },
                          "100%": {
                            boxShadow:
                              "0 0 0 0 rgba(var(--color-button-info-rgb), 0)",
                          },
                        },
                      }),
                    }}
                    ref={(el) => {
                      if (isHighlighted && el) {
                        // Scroll the highlighted setting into view after a short delay
                        setTimeout(() => {
                          (el as HTMLElement).scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }, 100);
                      }
                    }}
                  >
                    <SettingToggle
                      name={typedKey}
                      value={settings[typedKey]}
                      config={settingsConfig[key as SettingKey]}
                      onChange={handleSettingChange}
                      disabled={false}
                      userData={userData}
                    />
                    {category === "Appearance Settings" &&
                      key === "banner_discord" &&
                      settings[typedKey] === 0 && (
                        <BannerSettings
                          userData={userData}
                          onBannerUpdate={handleBannerUpdate}
                        />
                      )}
                    {category === "Appearance Settings" &&
                      key === "avatar_discord" &&
                      settings[typedKey] === 0 && (
                        <AvatarSettings
                          userData={userData}
                          onAvatarUpdate={handleAvatarUpdate}
                        />
                      )}
                  </Box>
                );
              })}
            </FormGroup>
            {category === "Appearance Settings" &&
              (settings.banner_discord === 0 ||
                settings.avatar_discord === 0) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={
                        <Icon icon="akar-icons:link-out" className="h-5 w-5" />
                      }
                      onClick={() =>
                        window.open(
                          "https://imgbb.com/",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      sx={{
                        backgroundColor: "var(--color-button-info)",
                        color: "var(--color-form-button-text)",
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        boxShadow: "var(--color-card-shadow)",
                        "&:hover": {
                          backgroundColor: "var(--color-button-info-hover)",
                          boxShadow: "var(--color-card-shadow)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      ImgBB
                    </Button>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={
                        <Icon icon="akar-icons:link-out" className="h-5 w-5" />
                      }
                      onClick={() =>
                        window.open(
                          "https://postimages.org/",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      sx={{
                        backgroundColor: "var(--color-button-info)",
                        color: "var(--color-form-button-text)",
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        boxShadow: "var(--color-card-shadow)",
                        "&:hover": {
                          backgroundColor: "var(--color-button-info-hover)",
                          boxShadow: "var(--color-card-shadow)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      PostImages
                    </Button>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={
                        <Icon icon="akar-icons:link-out" className="h-5 w-5" />
                      }
                      onClick={() =>
                        window.open(
                          "https://tenor.com/",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      sx={{
                        backgroundColor: "var(--color-button-info)",
                        color: "var(--color-form-button-text)",
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        boxShadow: "var(--color-card-shadow)",
                        "&:hover": {
                          backgroundColor: "var(--color-button-info-hover)",
                          boxShadow: "var(--color-card-shadow)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      Tenor
                    </Button>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={
                        <Icon icon="akar-icons:link-out" className="h-5 w-5" />
                      }
                      onClick={() =>
                        window.open(
                          "https://imgur.com/",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      sx={{
                        backgroundColor: "var(--color-button-info)",
                        color: "var(--color-form-button-text)",
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        boxShadow: "var(--color-card-shadow)",
                        "&:hover": {
                          backgroundColor: "var(--color-button-info-hover)",
                          boxShadow: "var(--color-card-shadow)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      Imgur
                    </Button>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={
                        <Icon icon="akar-icons:link-out" className="h-5 w-5" />
                      }
                      onClick={() =>
                        window.open(
                          "https://vgy.me/",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      sx={{
                        backgroundColor: "var(--color-button-info)",
                        color: "var(--color-form-button-text)",
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        boxShadow: "var(--color-card-shadow)",
                        "&:hover": {
                          backgroundColor: "var(--color-button-info-hover)",
                          boxShadow: "var(--color-card-shadow)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      vgy.me
                    </Button>
                  </Box>
                </>
              )}
          </Paper>
        );
      })}

      <Paper
        elevation={1}
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: "var(--color-secondary-bg)",
          color: "var(--color-primary-text)",
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "var(--color-primary-text)",
            mb: 2,
          }}
        >
          Account Connections
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <RobloxConnection userData={userData} />
      </Paper>

      <ExportInventoryData />

      <Paper
        elevation={1}
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: "var(--color-secondary-bg)",
          color: "var(--color-primary-text)",
          border: "2px solid var(--color-button-danger)",
          borderRadius: 2,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "var(--color-button-danger)",
            borderRadius: "2px 2px 0 0",
          },
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "var(--color-button-danger)",
            mb: 2,
          }}
        >
          Danger Zone
        </Typography>
        <Divider
          sx={{ mb: 2, bgcolor: "var(--color-button-danger)", opacity: 0.3 }}
        />
        <DeleteAccount />
      </Paper>

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
    </Container>
  );
}
