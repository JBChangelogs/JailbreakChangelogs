"use client";

import { useState, useCallback, type SyntheticEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PUBLIC_API_URL } from "@/utils/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { hasAuthSessionCookie } from "@/utils/serverSession";

export interface LoginModalController {
  tabValue: number;
  joinDiscord: boolean;
  campaign: string | null;
  resolvedTheme: string | undefined;
  showLoginModal: boolean;
  setJoinDiscord: (checked: boolean) => void;
  handleTabChange: (_event: SyntheticEvent, newValue: number) => void;
  handleClose: () => void;
  handleDiscordLogin: () => void;
  handleRobloxLogin: () => Promise<void>;
}

export function useLoginModalController(): LoginModalController {
  const [joinDiscord, setJoinDiscord] = useState(false);
  const { showLoginModal, loginModalTab, setLoginModal } = useAuthContext();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const campaign = searchParams.get("campaign");
  const tabValue = loginModalTab === "roblox" ? 1 : 0;

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setLoginModal({
      open: showLoginModal,
      tab: newValue === 1 ? "roblox" : "discord",
    });
  };

  const handleClose = useCallback(() => {
    setLoginModal({ open: false });
  }, [setLoginModal]);

  const handleDiscordLogin = useCallback(() => {
    const currentURL = window.location.href;
    const oauthRedirect = `${PUBLIC_API_URL}/oauth?redirect=${encodeURIComponent(currentURL)}${joinDiscord ? "&join_discord=true" : ""}`;

    toast.loading("Redirecting to Discord...", {
      duration: 2000,
    });

    window.location.href = oauthRedirect;
  }, [joinDiscord]);

  const handleRobloxLogin = useCallback(async () => {
    const hasCookie = await hasAuthSessionCookie();
    if (!hasCookie) {
      toast.error("You must be logged in with Discord first", {
        duration: 3000,
      });
      return;
    }

    try {
      const currentURL = window.location.href;
      const oauthRedirect = `/api/oauth/roblox/redirect?redirect=${encodeURIComponent(currentURL)}`;

      toast.loading("Redirecting to Roblox...", {
        duration: 2000,
      });

      window.location.href = oauthRedirect;
    } catch (error) {
      console.error("Error initiating Roblox OAuth:", error);
      toast.error("Failed to start Roblox authentication", {
        duration: 4000,
      });
    }
  }, []);

  return {
    tabValue,
    joinDiscord,
    campaign,
    resolvedTheme,
    showLoginModal,
    setJoinDiscord,
    handleTabChange,
    handleClose,
    handleDiscordLogin,
    handleRobloxLogin,
  };
}
