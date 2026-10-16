"use client";

import { useState, useCallback, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { buildApiLinkUrl, getDevToken } from "@/utils/api/apiDevToken";

export interface LoginModalController {
  tabValue: number;
  joinDiscord: boolean;
  canLinkRoblox: boolean;
  onlyRoblox: boolean;
  resolvedTheme: string | undefined;
  showLoginModal: boolean;
  setJoinDiscord: (checked: boolean) => void;
  handleTabChange: (_event: SyntheticEvent, newValue: number) => void;
  handleClose: () => void;
  handleDiscordLogin: () => void;
  handleRobloxLogin: () => void;
}

export function useLoginModalController(): LoginModalController {
  const [joinDiscord, setJoinDiscord] = useState(false);
  const {
    isAuthenticated,
    user,
    showLoginModal,
    loginModalTab,
    loginModalOnlyRoblox,
    setLoginModal,
  } = useAuthContext();
  const { resolvedTheme } = useTheme();
  const canLinkRoblox = isAuthenticated && Boolean(user) && !user?.roblox_id;
  const tabValue =
    canLinkRoblox && (loginModalOnlyRoblox || loginModalTab === "roblox")
      ? 1
      : 0;

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    if (!canLinkRoblox) {
      return;
    }

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

  const handleRobloxLogin = useCallback(() => {
    const tokenMatch = document.cookie.match(/(?:^|;\s*)jbcl_token=([^;]+)/);
    const { isDevEnv, injectedToken } = getDevToken();
    if (!canLinkRoblox || (!tokenMatch && !(isDevEnv && injectedToken))) {
      toast.info("You must be logged in with Discord first", {
        duration: 3000,
      });
      return;
    }

    const currentURL = new URL(window.location.href);
    currentURL.searchParams.set("auth_flow", "roblox-link");
    const oauthRedirect = buildApiLinkUrl(
      PUBLIC_API_URL,
      "/oauth/roblox",
      currentURL.toString(),
    );

    toast.loading("Redirecting to Roblox...", {
      duration: 2000,
    });

    window.location.href = oauthRedirect;
  }, [canLinkRoblox]);

  return {
    tabValue,
    joinDiscord,
    canLinkRoblox,
    onlyRoblox: canLinkRoblox && loginModalOnlyRoblox,
    resolvedTheme,
    showLoginModal,
    setJoinDiscord,
    handleTabChange,
    handleClose,
    handleDiscordLogin,
    handleRobloxLogin,
  };
}
