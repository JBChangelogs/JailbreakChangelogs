"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Fallback in case wsConnected never flips (e.g. reconnect retries exhaust).
const PENDING_TIMEOUT_MS = 8000;

export function useWsConnectionPending(wsConnected: boolean) {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setIsPending(false);
    clearPendingTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsConnected]);

  useEffect(() => clearPendingTimeout, [clearPendingTimeout]);

  const toggleConnection = useCallback(() => {
    setIsPending(true);
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsPending(false);
    }, PENDING_TIMEOUT_MS);
    window.dispatchEvent(
      new CustomEvent(
        wsConnected ? "realtimeManualDisconnect" : "realtimeManualConnect",
      ),
    );
  }, [wsConnected, clearPendingTimeout]);

  return { isPending, toggleConnection };
}
