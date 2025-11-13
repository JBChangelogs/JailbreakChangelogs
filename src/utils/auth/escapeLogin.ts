"use client";

import { useState, useEffect } from "react";
import { clientSession } from "@/utils/auth/clientSession";

const ESCAPE_COUNT_THRESHOLD = 5;
const ESCAPE_TIMEOUT = 2000; // 2 seconds

async function validateToken(token: string) {
  // Use centralized login method
  return await clientSession.login(token);
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
      // WebSocket has already validated and stored user data
      // Just dispatch the auth state change event
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: result.data }),
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
