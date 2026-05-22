"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { trackIdentify } from "@/utils/analytics/rybbit";

export default function RybbitIdentity() {
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const identify = () => {
      if (!window.rybbit) return false;

      const traits: Record<string, string | number> = {
        username: user.username,
        premium_type: user.premiumtype,
        created_at: user.created_at,
      };

      if (user.global_name && user.global_name !== "None") {
        traits.name = user.global_name;
      }

      if (user.roblox_username) {
        traits.roblox_username = user.roblox_username;
      }

      const useDiscord = user.settings?.avatar_discord === 1;
      const useCustom =
        user.settings?.avatar_discord === 0 &&
        user.premiumtype >= 2 &&
        user.custom_avatar &&
        user.custom_avatar !== "N/A";

      if (useCustom && user.custom_avatar) {
        traits.avatar = user.custom_avatar;
      } else if (useDiscord && user.avatar && user.avatar !== "None") {
        traits.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=256`;
      } else if (user.avatar && user.avatar !== "None") {
        traits.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=256`;
      }

      trackIdentify(user.id, traits);
      return true;
    };

    if (!identify()) {
      const timer = setTimeout(identify, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  return null;
}
