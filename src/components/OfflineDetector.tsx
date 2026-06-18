"use client";

import { useEffect, useRef, useState } from "react";

type ConnectionStatus = "online" | "offline" | "reconnected";

export default function OfflineDetector() {
  const [status, setStatus] = useState<ConnectionStatus>("online");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("reconnected");
      timerRef.current = setTimeout(() => setStatus("online"), 3000);
    };

    const handleOffline = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const initCheck = setTimeout(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setStatus("offline");
      }
    }, 100);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(initCheck);
      if (timerRef.current) clearTimeout(timerRef.current);
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
                  ? "You are currently offline. Check your internet connection."
                  : "You're back online!"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
