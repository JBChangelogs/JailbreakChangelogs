"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiLinkUrl, getDevToken } from "@/utils/api/apiDevToken";
import {
  getCaptchaType,
  type CaptchaType,
} from "@/utils/api/humanVerification";

export interface LoginModalController {
  joinDiscord: boolean;
  canLinkRoblox: boolean;
  showLoginModal: boolean;
  verification: {
    url: string;
    captchaType: CaptchaType;
    message: string;
  } | null;
  handleVerified: () => void;
  setJoinDiscord: (checked: boolean) => void;
  handleClose: () => void;
  handleDiscordLogin: () => void;
  handleRobloxLogin: () => void;
}

export function useLoginModalController(): LoginModalController {
  const [joinDiscord, setJoinDiscord] = useState(false);
  const [verification, setVerification] =
    useState<LoginModalController["verification"]>(null);
  const { isAuthenticated, user, showLoginModal, setLoginModal } =
    useAuthContext();
  const canLinkRoblox = isAuthenticated && Boolean(user) && !user?.roblox_id;

  useEffect(() => {
    if (showLoginModal && isAuthenticated && user?.roblox_id) {
      setLoginModal({ open: false });
    }
  }, [showLoginModal, isAuthenticated, user?.roblox_id, setLoginModal]);

  const handleClose = useCallback(() => {
    setLoginModal({ open: false });
  }, [setLoginModal]);

  const handleDiscordLogin = useCallback(async () => {
    const currentURL = window.location.href;
    const oauthRedirect = `${PUBLIC_API_URL}/oauth?redirect=${encodeURIComponent(currentURL)}${joinDiscord ? "&join_discord=true" : ""}`;

    try {
      const response = await fetch(oauthRedirect, {
        credentials: "include",
        redirect: "manual",
      });
      if (response.status === 403) {
        const body = await response.json().catch(() => null);
        if (body?.error === "challenge_required") {
          setVerification({
            url: oauthRedirect,
            captchaType: getCaptchaType(body.captcha_type),
            message:
              typeof body.message === "string"
                ? body.message
                : "Please complete human verification to continue.",
          });
          return;
        }
      }

      toast.loading("Redirecting to Discord...", { duration: 2000 });
      window.location.href = oauthRedirect;
    } catch {
      toast.error("Unable to start Discord login. Please try again.");
    }
  }, [joinDiscord]);

  const handleVerified = () => {
    if (verification) window.location.href = verification.url;
  };

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
    joinDiscord,
    canLinkRoblox,
    showLoginModal: showLoginModal && (!isAuthenticated || canLinkRoblox),
    verification,
    handleVerified,
    setJoinDiscord,
    handleClose,
    handleDiscordLogin,
    handleRobloxLogin,
  };
}
