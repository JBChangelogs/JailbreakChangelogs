import { toast } from "sonner";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { createLogger } from "@/services/logger";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

const log = createLogger("AUTH");

let lastLogoutSource: string = "Unknown";

export function trackLogoutSource(source: string) {
  lastLogoutSource = source;
}

export async function logout() {
  const source = lastLogoutSource || "Direct API Call";

  const logoutPromise = (async () => {
    log.info(`Logout initiated from: ${source}`);

    let sessionRevoked = false;
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/v2/users/me/session",
      );
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      sessionRevoked = response.ok || response.status === 401;
      if (!sessionRevoked) {
        log.warn("Session invalidation failed", { status: response.status });
      }
    } catch (error) {
      log.warn("Session invalidation failed", error);
    }

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("clear session failed", { status: response.status, body });
        throw new Error("Failed to clear session");
      }

      clearAuthData("user-initiated logout");
      return sessionRevoked;
    } catch (error) {
      log.error("Error during logout", error);
      throw error;
    }
  })();

  toast.promise(logoutPromise, {
    loading: "Logging you out...",
    success: (sessionRevoked) => ({
      message: "Logged out of this browser",
      description: sessionRevoked
        ? "Your session has been invalidated."
        : "We couldn't invalidate your session with the API. The session token may still be active.",
    }),
    error: {
      message: "Logout failed",
      description:
        "We couldn't clear your browser session. Please try logging out again.",
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
