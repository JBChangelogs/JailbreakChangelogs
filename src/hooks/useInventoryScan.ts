"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { INVENTORY_API_URL, ENABLE_WS_SCAN } from "@/utils/api/api";
import { getJbclToken } from "@/contexts/AuthContext";
import type { ScanPhase } from "@/utils/notifications/scanProgressMessage";
import { trackWebEvent } from "@/utils/analytics/web";

type ScanStatus = "idle" | "connecting" | "scanning" | "completed" | "error";

export interface UseInventoryScanReturn {
  status: ScanStatus;
  phase: ScanPhase | undefined;
  message: string | undefined;
  progress: number | undefined;
  error: string | undefined;
  queuePosition: number | undefined;
  startScan: () => void;
}

interface ScanEventData {
  message?: string;
  attempt?: number;
  total_attempts?: number;
  queue?: { position?: number };
  scan?: { user_id?: string } | null;
  user_id?: string;
}

const SCAN_CHECK_MS = 20_000;

function scanRequestError(
  status: number,
  detail: unknown,
): { message: string; phase: ScanPhase } {
  if (status === 401)
    return {
      message: "Please log in again to scan your inventory.",
      phase: "error",
    };
  if (status === 400)
    return {
      message: "Link your Roblox account to scan your inventory.",
      phase: "error",
    };
  if (status === 403)
    return {
      message: "Supporter III is required for on-demand scans.",
      phase: "supporter_required",
    };
  if (status === 409)
    return {
      message:
        "You have a recent scan. Please wait before requesting another scan.",
      phase: "error",
    };
  return {
    message:
      typeof detail === "string" && detail ? detail : "Failed to request scan",
    phase: "error",
  };
}

export function useInventoryScan(
  userId: string,
  enabled: boolean,
): UseInventoryScanReturn {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [phase, setPhase] = useState<ScanPhase | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>();
  const [progress, setProgress] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [queuePosition, setQueuePosition] = useState<number | undefined>();
  const scanStartedAtRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      scanStartedAtRef.current === null ||
      (status !== "completed" && status !== "error")
    )
      return;
    const duration_ms = Math.round(
      performance.now() - scanStartedAtRef.current,
    );
    scanStartedAtRef.current = null;
    if (status === "error") {
      trackWebEvent("inventory_scan_failed", {
        code: phase ?? "error",
        duration_ms,
      });
    } else {
      trackWebEvent(
        phase === "queued"
          ? "inventory_scan_queued"
          : "inventory_scan_completed",
        { duration_ms },
      );
    }
  }, [status, phase]);

  const update = useCallback(
    (
      nextStatus: ScanStatus,
      nextPhase: ScanPhase,
      nextMessage: string,
      nextProgress?: number,
    ) => {
      setStatus(nextStatus);
      setPhase(nextPhase);
      setMessage(nextMessage);
      setError(undefined);
      if (nextProgress !== undefined) setProgress(nextProgress);
    },
    [],
  );

  const fail = useCallback(
    (nextError: string, nextPhase: ScanPhase = "error") => {
      setError(nextError);
      setStatus("error");
      setPhase(nextPhase);
      setProgress(undefined);
    },
    [],
  );

  // Socket events sent while it was reconnecting (e.g. during a reload) are
  // lost, so when the scan goes quiet ask the API whether it's still running.
  useEffect(() => {
    const token = getJbclToken();
    if (status !== "scanning" || !token || !INVENTORY_API_URL) return;
    const interval = setInterval(async () => {
      const response = await fetch(
        `${INVENTORY_API_URL}/v2/me/scan?token=${encodeURIComponent(token)}`,
      ).catch(() => null);
      if (response?.status === 404) {
        void queryClient.invalidateQueries({ queryKey: ["inventory"] });
        setQueuePosition(undefined);
        update("completed", "completed", "Scan finished", 100);
      }
    }, SCAN_CHECK_MS);
    return () => clearInterval(interval);
  }, [status, phase, message, queryClient, update]);

  useEffect(() => {
    if (!enabled || !userId) return;
    const onScan = (event: Event) => {
      const { action, data = {} } = (
        event as CustomEvent<{ action: string; data?: ScanEventData }>
      ).detail;

      if (action === "inventory_scanned") {
        if (String(data.user_id) !== userId) return;
        void queryClient.invalidateQueries({ queryKey: ["inventory"] });
        // Also fires for automatic trade-server scans; only finish one we're showing.
        if (status === "scanning") {
          setQueuePosition(undefined);
          update("completed", "completed", "Scan completed successfully!", 100);
        }
        return;
      }
      if (String(data.scan?.user_id) !== userId) return;

      const msg = data.message ?? "";
      const lower = msg.toLowerCase();
      switch (action) {
        case "scan_retry":
          update(
            "scanning",
            "retrying",
            `${msg} - Retrying (${data.attempt}/${data.total_attempts})`,
            5,
          );
          return;
        case "scan_requested":
          update("scanning", "requested", msg || "Scan requested", 10);
          return;
        case "scan_queued":
          setQueuePosition(data.queue?.position);
          update("scanning", "queued", msg, 90);
          return;
        case "scan_failed":
          fail(msg || "Failed to request scan");
          return;
        case "scan_update":
          if (lower.includes("not found"))
            fail(
              "User not found in game. Please join a trade server and try again.",
              "failed_not_in_server",
            );
          else if (lower.includes("server full"))
            fail("Server Full", "server_full");
          else if (lower.includes("user found"))
            update("scanning", "user_found", msg, 50);
          else if (lower.includes("bot joined server"))
            update("scanning", "bot_joined", msg, 75);
          else update("scanning", "scanning", msg || "Scanning in progress...");
          return;
      }
    };
    window.addEventListener("realtimeScan", onScan);
    return () => window.removeEventListener("realtimeScan", onScan);
  }, [enabled, userId, status, queryClient, update, fail]);

  useEffect(() => {
    const token = getJbclToken();
    if (!enabled || !ENABLE_WS_SCAN || !INVENTORY_API_URL || !token) return;
    const controller = new AbortController();
    fetch(
      `${INVENTORY_API_URL}/v2/me/scan?token=${encodeURIComponent(token)}`,
      {
        signal: controller.signal,
      },
    )
      .then((response) => {
        if (response.ok)
          update("scanning", "requested", "Scan in progress...", 10);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [enabled, update]);

  const requestScan = useCallback(async () => {
    setStatus("connecting");
    setPhase("connecting");
    setMessage(undefined);
    setProgress(undefined);
    setError(undefined);
    setQueuePosition(undefined);
    const token = getJbclToken();
    if (!token || !INVENTORY_API_URL) {
      fail("Please log in again to scan your inventory.");
      return;
    }
    try {
      const response = await fetch(
        `${INVENTORY_API_URL}/v2/me/scan?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      if (response.ok) {
        // Socket events can beat the 202 here; don't overwrite them.
        setStatus((s) => (s === "connecting" ? "scanning" : s));
        setPhase((p) => (p === "connecting" ? "requested" : p));
        setMessage((m) => m ?? "Scan requested");
        return;
      }
      const body = (await response.json().catch(() => null)) as {
        detail?: unknown;
      } | null;
      const { message: errorMessage, phase: errorPhase } = scanRequestError(
        response.status,
        body?.detail,
      );
      fail(errorMessage, errorPhase);
    } catch {
      fail("Failed to reach the scan service. Please try again.");
    }
  }, [fail]);

  const startScan = useCallback(() => {
    trackWebEvent("inventory_scan_requested");
    if (!userId) {
      trackWebEvent("inventory_scan_failed", { code: "missing_user" });
      setError("No user ID provided");
      setStatus("error");
      setPhase("error");
      return;
    }

    if (!ENABLE_WS_SCAN) {
      trackWebEvent("inventory_scan_failed", { code: "disabled" });
      setError("Inventory scanning is temporarily disabled");
      setStatus("error");
      setPhase("error");
      return;
    }

    scanStartedAtRef.current = performance.now();
    void requestScan();
  }, [userId, requestScan]);

  return {
    status,
    phase,
    message,
    progress,
    error,
    queuePosition,
    startScan,
  };
}
