import { toast } from "sonner";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { createLogger } from "@/services/logger";

const log = createLogger("AUTH");

let lastLogoutSource: string = "Unknown";

export function trackLogoutSource(source: string) {
  lastLogoutSource = source;
}

export async function logout() {
  const source = lastLogoutSource || "Direct API Call";

  const logoutPromise = (async () => {
    log.info(`Logout initiated from: ${source}`);

    // Create AbortController for request cancellation
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("clear session failed", { status: response.status, body });
        throw new Error("Failed to clear session");
      }

      clearAuthData("user-initiated logout");
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        log.info("Logout request was aborted, clearing auth data locally");
        clearAuthData("logout request aborted");
        // Best-effort retry without a timeout so the cookie gets cleared even if the first request was slow
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        return;
      }
      log.error("Error during logout", error);
      throw error;
    }
  })();

  toast.promise(logoutPromise, {
    loading: "Logging you out...",
    success: {
      message: "Successfully logged out!",
      description: "Your session has been cleared. Come back soon!",
    },
    error: {
      message: "Logout failed",
      description:
        "We couldn't clear your session on the server, but you have been logged out locally.",
    },
  });

  return logoutPromise;
}

function clearAuthData(reason: string) {
  log.info(`Clearing auth data. Reason: ${reason}`);

  safeLocalStorage.removeItem("user");
  safeLocalStorage.removeItem("userid");
  safeLocalStorage.removeItem("avatar");

  window.dispatchEvent(new CustomEvent("authStateChanged"));
}
