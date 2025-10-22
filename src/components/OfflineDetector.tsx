"use client";

import { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";

export default function OfflineDetector() {
  // Start with false (online) to avoid false offline messages
  // Only show offline when we actually detect offline events
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Check initial state after component mounts
    // This ensures we get the actual current state rather than relying on initial navigator.onLine
    const checkInitialState = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOffline(true);
      }
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial state after a brief delay to ensure navigator is ready
    const timeoutId = setTimeout(checkInitialState, 100);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Alert
      severity="warning"
      icon={<WifiOffRoundedIcon />}
      sx={{
        width: "100%",
        bgcolor: "#B45309",
        color: "#FFFFFF",
        "& .MuiAlert-icon": {
          color: "#FFFFFF",
          marginRight: 1,
          marginLeft: 0,
        },
        position: "fixed",
        top: "64px",
        left: 0,
        right: 0,
        zIndex: 9999,
        display: isOffline ? "flex" : "none",
        borderRadius: 0,
        justifyContent: "center",
        "& .MuiAlert-message": {
          textAlign: "center",
          width: "auto",
        },
      }}
    >
      You are currently offline. Check your internet connection.
    </Alert>
  );
}
