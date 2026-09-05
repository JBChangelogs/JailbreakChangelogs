"use client";

import { useEffect, useRef, useState } from "react";

type ConnectionStatus = "online" | "offline" | "reconnected";

const INITIAL_RETRY_DELAY = 30000;
const MAX_RETRY_DELAY = 300000;
const RETRY_JITTER = 0.75 + Math.random() * 0.5;

let sharedConnectivityProbe: Promise<void> | null = null;

function probeSiteConnectivity(): Promise<void> {
  if (sharedConnectivityProbe) return sharedConnectivityProbe;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const request = fetch(`/api/healthcheck?t=${Date.now()}`, {
    cache: "no-store",
    signal: controller.signal,
  }).then(() => undefined);

  const probe = request.finally(() => {
    clearTimeout(timeout);
    if (sharedConnectivityProbe === probe) sharedConnectivityProbe = null;
  });

  sharedConnectivityProbe = probe;
  return probe;
}

export default function OfflineDetector() {
  const [status, setStatus] = useState<ConnectionStatus>("online");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIdRef = useRef(0);
  const confirmedOfflineRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let retryAttempt = 0;

    const checkConnectivity = async (): Promise<void> => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const checkId = ++checkIdRef.current;

      try {
        // navigator.onLine is only a browser/OS heuristic. Confirm that this
        // application is actually unreachable before showing a warning.
        await probeSiteConnectivity();

        if (!mounted || checkId !== checkIdRef.current) return;

        retryAttempt = 0;
        const wasOffline = confirmedOfflineRef.current;
        confirmedOfflineRef.current = false;
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        if (wasOffline) {
          setStatus("reconnected");
          hideTimerRef.current = setTimeout(() => setStatus("online"), 3000);
        } else {
          setStatus("online");
        }
      } catch {
        if (!mounted || checkId !== checkIdRef.current) return;

        confirmedOfflineRef.current = true;
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setStatus("offline");

        const retryDelay = Math.min(
          INITIAL_RETRY_DELAY * 2 ** retryAttempt,
          MAX_RETRY_DELAY,
        );
        retryAttempt += 1;
        retryTimerRef.current = setTimeout(() => {
          void checkConnectivity();
        }, retryDelay * RETRY_JITTER);
      }
    };

    const handleNetworkChange = () => {
      void checkConnectivity();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        confirmedOfflineRef.current
      ) {
        void checkConnectivity();
      }
    };

    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const initCheck = setTimeout(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        void checkConnectivity();
      }
    }, 100);

    return () => {
      mounted = false;
      checkIdRef.current += 1;
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(initCheck);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const isVisible = status !== "online";
  const isOffline = status === "offline";

  return (
    <div
      className={`grid transition-all duration-300 ease-in-out ${
        isVisible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="w-full transition-colors duration-300"
          style={{
            backgroundColor: isOffline
              ? "var(--color-status-warning)"
              : "var(--color-form-success)",
            color: isOffline ? "var(--color-primary-bg)" : "#fff",
          }}
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-center text-xs font-semibold">
                {isOffline
                  ? "Unable to connect to Jailbreak Changelogs. Check your connection and try again."
                  : "You're back online!"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
