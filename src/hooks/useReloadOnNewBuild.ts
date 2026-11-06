import { useEffect } from "react";

// Crashes right after a deploy are usually version skew; reload once per build.
export function useReloadOnNewBuild() {
  useEffect(() => {
    const buildTime = Number(process.env.NEXT_PUBLIC_BUILD_TIME);
    if (
      process.env.NODE_ENV !== "production" ||
      !Number.isFinite(buildTime) ||
      buildTime <= 0
    )
      return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    const recover = async () => {
      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const { date } = await response.json();
        if (
          controller.signal.aborted ||
          typeof date !== "number" ||
          !Number.isFinite(date) ||
          date <= buildTime
        )
          return;

        const key = "global-error-reload-build";
        const lastAttempt = Number(window.sessionStorage.getItem(key)) || 0;
        if (date <= lastAttempt) return;
        window.sessionStorage.setItem(key, String(date));
        window.location.reload();
      } catch {
      } finally {
        window.clearTimeout(timeout);
      }
    };
    void recover();
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);
}
