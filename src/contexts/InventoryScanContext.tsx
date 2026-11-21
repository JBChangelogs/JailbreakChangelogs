"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  useInventoryScan,
  type UseInventoryScanReturn,
} from "@/hooks/useInventoryScan";
import { formatScanProgressMessage } from "@/utils/notifications/scanProgressMessage";
import {
  dismissScanLoadingToast,
  showScanErrorToast,
  showScanLoadingToast,
  showScanSuccessToast,
  updateScanLoadingToast,
} from "@/utils/notifications/scanToasts";

const InventoryScanContext = createContext<UseInventoryScanReturn | null>(null);

export function InventoryScanProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthContext();
  const robloxId = isAuthenticated ? (user?.roblox_id ?? "") : "";
  const scan = useInventoryScan(robloxId, Boolean(robloxId));
  const { status, phase, message, progress, error } = scan;
  const lastOutcomeRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "connecting") {
      lastOutcomeRef.current = null;
      showScanLoadingToast("Requesting scan...");
      return;
    }
    if (status === "scanning") {
      updateScanLoadingToast(
        formatScanProgressMessage(phase, message, progress),
      );
      return;
    }
    if (status !== "completed" && status !== "error") return;

    const outcome = `${status}:${status === "error" ? error : message}`;
    if (lastOutcomeRef.current === outcome) return;
    lastOutcomeRef.current = outcome;
    dismissScanLoadingToast();
    if (status === "completed") {
      showScanSuccessToast(message || "Scan completed successfully!");
    } else if (error && phase !== "supporter_required") {
      // supporter_required opens the upgrade modal on the inventory page instead.
      showScanErrorToast(error);
    }
  }, [status, phase, message, progress, error]);

  return (
    <InventoryScanContext.Provider value={scan}>
      {children}
    </InventoryScanContext.Provider>
  );
}

export function useInventoryScanContext(): UseInventoryScanReturn {
  const context = useContext(InventoryScanContext);
  if (!context)
    throw new Error(
      "useInventoryScanContext must be used within InventoryScanProvider",
    );
  return context;
}
