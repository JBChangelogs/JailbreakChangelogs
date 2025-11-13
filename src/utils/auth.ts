import toast from "react-hot-toast";
import { AuthResponse } from "../types/auth";
import { safeLocalStorage } from "./safeStorage";
import { clientSession } from "./clientSession";
// Pure WebSocket-based authentication - no HTTP API calls needed

let lastLogoutSource: string = "Unknown";

// Track active toasts to prevent duplicates
let activeWelcomeToast: string | null = null;
let activeLogoutToast: string | null = null;
let activeLoginLoadingToast: string | null = null;
let activeLogoutLoadingToast: string | null = null;
let activeProcessingAuthToast: string | null = null;

/**
 * Shows a welcome toast with deduplication to prevent multiple welcome messages
 */
function showWelcomeToast(username: string): void {
  // If there's already an active welcome toast, dismiss it first
  if (activeWelcomeToast) {
    toast.dismiss(activeWelcomeToast);
  }

  // Show new welcome toast and track its ID
  activeWelcomeToast = toast.success(`Welcome back, ${username}!`, {
    duration: 3000,
    position: "bottom-right",
  });

  // Clear the tracking when toast expires
  setTimeout(() => {
    activeWelcomeToast = null;
  }, 3000);
}

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
    duration: 3000,
    position: "bottom-right",
  });

  // Clear the tracking when toast expires
  setTimeout(() => {
    activeLogoutToast = null;
  }, 3000);
}

/**
 * Shows a login loading toast with deduplication to prevent multiple loading messages
 */
export function showLoginLoadingToast(): string {
  // If there's already an active login loading toast, dismiss it first
  if (activeLoginLoadingToast) {
    toast.dismiss(activeLoginLoadingToast);
  }

  // Show new login loading toast and track its ID
  activeLoginLoadingToast = toast.loading("Logging you in...", {
    duration: Infinity,
    position: "bottom-right",
  });

  return activeLoginLoadingToast;
}

/**
 * Shows a logout loading toast with deduplication to prevent multiple loading messages
 */
export function showLogoutLoadingToast(): string {
  // If there's already an active logout loading toast, dismiss it first
  if (activeLogoutLoadingToast) {
    toast.dismiss(activeLogoutLoadingToast);
  }

  // Show new logout loading toast and track its ID
  activeLogoutLoadingToast = toast.loading("Logging you out...", {
    duration: Infinity,
    position: "bottom-right",
  });

  return activeLogoutLoadingToast;
}

/**
 * Dismisses a login loading toast and clears tracking
 */
export function dismissLoginLoadingToast(toastId?: string): void {
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
export function dismissLogoutLoadingToast(toastId?: string): void {
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
export function showProcessingAuthToast(): string {
  // If there's already an active processing auth toast, dismiss it first
  if (activeProcessingAuthToast) {
    toast.dismiss(activeProcessingAuthToast);
  }

  // Show new processing auth toast and track its ID
  activeProcessingAuthToast = toast.loading("Processing authentication...", {
    duration: Infinity,
    position: "bottom-right",
  });

  return activeProcessingAuthToast;
}

/**
 * Dismisses a processing authentication toast and clears tracking
 */
export function dismissProcessingAuthToast(toastId?: string): void {
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

  try {
    console.group("🔐 Logout Process");
    console.log("📝 Logout Details:", {
      Source: source,
      Timestamp: new Date().toISOString(),
    });

    // Use centralized logout method
    await clientSession.logout();
    console.groupEnd();
  } catch (error) {
    console.error("❌ Error During Logout:", {
      Source: source,
      Timestamp: new Date().toISOString(),
      "Error Message": error instanceof Error ? error.message : "Unknown error",
      "Stack Trace": error instanceof Error ? error.stack : undefined,
    });
    console.groupEnd();
    throw error;
  }
}

export async function validateAuth(): Promise<boolean> {
  // Since we moved to WebSocket, just check localStorage for user data
  // WebSocket will handle real-time validation and updates
  const userData = safeLocalStorage.getItem("user");
  return !!userData;
}

export async function handleTokenAuth(token: string): Promise<AuthResponse> {
  let loadingToast: string | undefined;

  try {
    // Show loading toast with deduplication
    loadingToast = showLoginLoadingToast();

    // Use centralized login method
    const result = await clientSession.login(token);

    if (result.success && result.data) {
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      showWelcomeToast(result.data.username);
      return { success: true, data: result.data };
    } else {
      throw new Error(result.error || "Login failed");
    }
  } catch (error) {
    console.error("Token authentication error:", error);
    toast.error("Failed to log in. Please try again.", {
      duration: 3000,
      position: "bottom-right",
    });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to validate token",
    };
  } finally {
    // Always dismiss the loading toast
    dismissLoginLoadingToast(loadingToast);
  }
}

export function isAuthenticated(): boolean {
  // Check localStorage for user data as a quick check
  // The actual validation happens through WebSocket real-time updates
  const userData = safeLocalStorage.getItem("user");
  return !!userData;
}

export function getToken(): string | null {
  // This function is deprecated - use clientSession.getToken() instead
  // WebSocket session manager handles token access properly
  console.warn(
    "getToken() is deprecated - use clientSession.getToken() for WebSocket-based auth",
  );
  return null;
}
