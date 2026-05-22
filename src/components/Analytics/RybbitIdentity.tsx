"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function RybbitIdentity() {
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated && user && window.rybbit) {
      try {
        const traits: Record<string, string | number> = {
          username: user.username,
          premium_type: user.premiumtype,
          created_at: user.created_at,
        };

        if (user.roblox_username) {
          traits.roblox_username = user.roblox_username;
        }

        window.rybbit.identify(user.id, traits);
      } catch (error) {
        console.error("Failed to identify user in Rybbit:", error);
      }
    }
  }, [isAuthenticated, user]);

  return null;
}
