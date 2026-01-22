"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function UmamiIdentity() {
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    // Only run if authenticated and window.umami exists
    if (isAuthenticated && user && window.umami) {
      try {
        // Identify user in Umami with session data
        const sessionData: Record<string, string | number> = {
          username: user.username,
          premium_type: user.premiumtype,
          created_at: user.created_at,
        };

        // Only include Roblox username if it exists (backend returns null when not linked)
        if (user.roblox_username) {
          sessionData.roblox_username = user.roblox_username;
        }

        window.umami.identify(user.id, sessionData);
      } catch (error) {
        console.error("Failed to identify user in Umami:", error);
      }
    }
  }, [isAuthenticated, user]);

  return null;
}
