"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect } from "react";
import { loginWithToken } from "./login";
import { safeLocalStorage, safeSetJSON } from "@/utils/storage/safeStorage";
import {
  normalizeMeResponse,
  type MeResponse,
} from "@/utils/auth/normalizeMeResponse";

const log = createLogger("AUTH");

const ESCAPE_COUNT_THRESHOLD = 5;
const ESCAPE_TIMEOUT = 2000; // 2 seconds

async function validateToken(token: string) {
  try {
    const data = await loginWithToken(token);
    return { success: true, data };
  } catch (error) {
    log.error("Error validating token", error);
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
      const rawUserData = Array.isArray(result.data)
        ? result.data[0]
        : result.data;
      const userData = normalizeMeResponse(rawUserData as MeResponse);

      // Store user data in localStorage
      safeSetJSON("user", userData);
      safeLocalStorage.setItem("userid", userData.id);
      safeLocalStorage.setItem("avatar", userData.avatar);

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
