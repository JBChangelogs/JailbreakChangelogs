"use client";

import { useState, useEffect } from "react";
// import { PUBLIC_API_URL } from '@/utils/api';
import { safeLocalStorage, safeSetJSON } from "@/utils/safeStorage";

const ESCAPE_COUNT_THRESHOLD = 5;
const ESCAPE_TIMEOUT = 2000; // 2 seconds

async function validateToken(token: string) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Failed to validate token");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error validating token:", error);
    return { success: false, error: "Failed to validate token" };
  }
}

export function useEscapeLogin() {
  const [escapeCount, setEscapeCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [lastEscapeTime, setLastEscapeTime] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const now = Date.now();

        if (lastEscapeTime && now - lastEscapeTime > ESCAPE_TIMEOUT) {
          // Reset count if too much time has passed
          setEscapeCount(1);
        } else {
          setEscapeCount((prev) => prev + 1);
        }

        setLastEscapeTime(now);

        if (escapeCount + 1 >= ESCAPE_COUNT_THRESHOLD) {
          setShowModal(true);
          setEscapeCount(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [escapeCount, lastEscapeTime]);

  const handleTokenSubmit = async (token: string) => {
    const result = await validateToken(token);
    if (result.success) {
      // Extract just the user data from the result
      const userData = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

      // Store user data in localStorage
      safeSetJSON("user", userData);
      safeLocalStorage.setItem("userid", userData.id);
      safeLocalStorage.setItem("avatar", userData.avatar);

      // Cookie is set by server route

      // Set avatar if available
      if (userData.avatar) {
        const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}?size=4096`;
        safeLocalStorage.setItem("avatar", avatarURL);
      }

      // Dispatch custom event for components to listen to
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: userData }),
      );

      // Dismiss modal and reload
      setShowModal(false);
      window.location.reload();
    }
    return result;
  };

  return {
    showModal,
    setShowModal,
    handleTokenSubmit,
  };
}
