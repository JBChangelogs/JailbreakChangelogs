"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function RybbitIdentity() {
  const { user, isAuthenticated } = useAuthContext();
  const didIdentifyRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      didIdentifyRef.current = false;
      return;
    }

    const doIdentify = () => {
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

      try {
        if (didIdentifyRef.current) {
          // Already identified this session — user object updated mid-session (e.g. Roblox linked, premium changed)
          window.rybbit.setTraits(traits);
        } else {
          const isNewLogin = window.rybbit.getUserId() !== user.id;
          window.rybbit.identify(user.id, traits);
          if (isNewLogin) {
            window.rybbit.event("User Login");
          }
          didIdentifyRef.current = true;
        }
      } catch (error) {
        console.error("Failed to identify user in Rybbit:", error);
        didIdentifyRef.current = true;
      }

      return true;
    };

    if (!doIdentify()) {
      const interval = setInterval(() => {
        if (doIdentify()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  return null;
}
