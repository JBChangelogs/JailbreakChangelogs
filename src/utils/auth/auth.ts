import { toast } from "sonner";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { createLogger } from "@/services/logger";

const log = createLogger("AUTH");

let lastLogoutSource: string = "Unknown";
let activeLogoutToast: string | number | null = null;
let activeLoginLoadingToast: string | number | null = null;
let activeLogoutLoadingToast: string | number | null = null;
let activeProcessingAuthToast: string | number | null = null;

/**
 * Shows a logout success toast with deduplication to prevent multiple logout messages
 */
export function showLogoutToast(): void {
  // If there's already an active logout toast, dismiss it first
  if (activeLogoutToast) {
    toast.dismiss(activeLogoutToast);
  }

  // Show new logout toast and track its ID
  activeLogoutToast = toast.success("Successfully logged out!", {
    description: "Your session has been cleared. Come back soon!",
    duration: 3000,
  });

  // Clear the tracking when toast expires
  setTimeout(() => {
    activeLogoutToast = null;
  }, 3000);
}

/**
 * Shows a login loading toast with deduplication to prevent multiple loading messages
 */
export function showLoginLoadingToast(): string | number {
  // If there's already an active login loading toast, dismiss it first
  if (activeLoginLoadingToast) {
    toast.dismiss(activeLoginLoadingToast);
  }

  // Show new login loading toast and track its ID
  activeLoginLoadingToast = toast.loading("Logging you in...", {
    duration: Infinity,
  });

  return activeLoginLoadingToast;
}

/**
 * Shows a logout loading toast with deduplication to prevent multiple loading messages
 */
export function showLogoutLoadingToast(): string | number {
  // If there's already an active logout loading toast, dismiss it first
  if (activeLogoutLoadingToast) {
    toast.dismiss(activeLogoutLoadingToast);
  }

  // Show new logout loading toast and track its ID
  activeLogoutLoadingToast = toast.loading("Logging you out...", {
    duration: Infinity,
  });

  return activeLogoutLoadingToast;
}

/**
 * Dismisses a login loading toast and clears tracking
 */
export function dismissLoginLoadingToast(toastId?: string | number): void {
  if (toastId) {
    toast.dismiss(toastId);
  } else if (activeLoginLoadingToast) {
    toast.dismiss(activeLoginLoadingToast);
  }
  activeLoginLoadingToast = null;
}

/**
 * Dismisses a logout loading toast and clears tracking
 */
export function dismissLogoutLoadingToast(toastId?: string | number): void {
  if (toastId) {
    toast.dismiss(toastId);
  } else if (activeLogoutLoadingToast) {
    toast.dismiss(activeLogoutLoadingToast);
  }
  activeLogoutLoadingToast = null;
}

/**
 * Shows a processing authentication toast with deduplication
 */
export function showProcessingAuthToast(): string | number {
  // If there's already an active processing auth toast, dismiss it first
  if (activeProcessingAuthToast) {
    toast.dismiss(activeProcessingAuthToast);
  }

  // Show new processing auth toast and track its ID
  activeProcessingAuthToast = toast.loading("Processing authentication...", {
    duration: Infinity,
  });

  return activeProcessingAuthToast;
}

/**
 * Dismisses a processing authentication toast and clears tracking
 */
export function dismissProcessingAuthToast(toastId?: string | number): void {
  if (toastId) {
    toast.dismiss(toastId);
  } else if (activeProcessingAuthToast) {
    toast.dismiss(activeProcessingAuthToast);
  }
  activeProcessingAuthToast = null;
}

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

export function isAuthenticated(): boolean {
  const userData = safeLocalStorage.getItem("user");
  return !!userData;
}

export function getToken(): string | null {
  // Token is HttpOnly, so we can't access it from client-side
  // This function is deprecated and should not be used
  log.warn(
    "getToken() is deprecated — token is HttpOnly and cannot be accessed client-side",
  );
  return null;
}
