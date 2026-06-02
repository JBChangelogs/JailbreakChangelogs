"use client";

import { useState, useCallback, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export interface LoginModalController {
  tabValue: number;
  joinDiscord: boolean;
  hasJbclToken: boolean;
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
  const { showLoginModal, loginModalTab, loginModalOnlyRoblox, setLoginModal } =
    useAuthContext();
  const { resolvedTheme } = useTheme();
  const hasJbclToken =
    typeof document !== "undefined" &&
    /(?:^|;\s*)jbcl_token=([^;]+)/.test(document.cookie);
  const tabValue = hasJbclToken && loginModalTab === "roblox" ? 1 : 0;

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    if (!hasJbclToken) {
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
    if (!tokenMatch) {
      toast.info("You must be logged in with Discord first", {
        duration: 3000,
      });
      return;
    }

    const token = decodeURIComponent(tokenMatch[1]);
    const currentURL = new URL(window.location.href);
    currentURL.searchParams.set("auth_flow", "roblox-link");
    const oauthRedirect = `${PUBLIC_API_URL}/oauth/roblox?redirect=${encodeURIComponent(currentURL.toString())}&owner=${encodeURIComponent(token)}`;

    toast.loading("Redirecting to Roblox...", {
      duration: 2000,
    });

    window.location.href = oauthRedirect;
  }, []);

  return {
    tabValue,
    joinDiscord,
    hasJbclToken,
    onlyRoblox: loginModalOnlyRoblox,
    resolvedTheme,
    showLoginModal,
    setJoinDiscord,
    handleTabChange,
    handleClose,
    handleDiscordLogin,
    handleRobloxLogin,
  };
}
