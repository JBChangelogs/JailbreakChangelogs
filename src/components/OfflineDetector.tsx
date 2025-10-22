"use client";

import { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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
