import { toast } from "sonner";
import { UserData, AuthResponse } from "../types/auth";
import { safeLocalStorage, safeSetJSON } from "./safeStorage";

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
    position: "top-center",
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
    position: "top-center",
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
    position: "top-center",
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
    position: "top-center",
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
    console.group("🔐 Logout Process");
    console.log("📝 Logout Details:", {
      Source: source,
      Timestamp: new Date().toISOString(),
    });

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
        throw new Error("Failed to clear session");
      }

      clearAuthData("user-initiated logout");
      console.groupEnd();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Logout request was aborted, clearing auth data locally");
        clearAuthData("logout request aborted");
        console.groupEnd();
        return;
      }
      console.error("❌ Error During Logout:", error);
      console.groupEnd();
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
  console.log(`Clearing auth data. Reason: ${reason}`);

  safeLocalStorage.removeItem("user");
  safeLocalStorage.removeItem("userid");
  safeLocalStorage.removeItem("avatar");

  window.dispatchEvent(new CustomEvent("authStateChanged"));
}

// Cache for ongoing auth validation to prevent multiple simultaneous calls
let authValidationPromise: Promise<boolean> | null = null;
let lastAuthValidation = 0;
const AUTH_VALIDATION_COOLDOWN = 10000; // 10 seconds cooldown between validations

export async function validateAuth(): Promise<boolean> {
  const now = Date.now();

  // If there's already a validation in progress, return that promise
  if (authValidationPromise) {
    return authValidationPromise;
  }

  // If we validated recently, return cached result
  if (now - lastAuthValidation < AUTH_VALIDATION_COOLDOWN) {
    // Check localStorage for user data as a quick check
    const userData = safeLocalStorage.getItem("user");
    return !!userData;
  }

  // Start new validation
  authValidationPromise = performAuthValidation();

  try {
    const result = await authValidationPromise;
    lastAuthValidation = now;
    return result;
  } finally {
    authValidationPromise = null;
  }
}

async function performAuthValidation(): Promise<boolean> {
  // Create AbortController for request cancellation
  const abortController = new AbortController();

  // Set a timeout to abort the request after 10 seconds
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, 10000);

  try {
    const response = await fetch("/api/session", {
      cache: "no-store",
      signal: abortController.signal,
    });

    // Clear timeout since request completed
    clearTimeout(timeoutId);

    const { user } = (await response.json()) as { user: UserData | null };
    if (user) {
      safeSetJSON("user", user);
      safeLocalStorage.setItem("userid", user.id);
      if (user.avatar) {
        const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=4096`;
        safeLocalStorage.setItem("avatar", avatarURL);
      }
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: user }),
      );
      return true;
    }
    clearAuthData("session not found");
    return false;
  } catch (error) {
    // Clear timeout in case of error
    clearTimeout(timeoutId);

    // Handle AbortError specifically - don't treat it as a real error
    if (error instanceof Error && error.name === "AbortError") {
      console.log(
        "Auth validation request was aborted, keeping previous state",
      );
      return true; // Keep previous state when request is aborted
    }

    // For other errors, log them but don't log out; keep previous state
    console.error("Auth validation error:", error);
    return true;
  }
}

export async function handleTokenAuth(token: string): Promise<AuthResponse> {
  const loginPromise = (async () => {
    // Create AbortController for request cancellation
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 15000);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Invalid or expired session token.");
      }

      const userData: UserData = await response.json();

      // Set local storage
      safeSetJSON("user", userData);
      safeLocalStorage.setItem("userid", userData.id);

      // Set avatar if available
      if (userData.avatar) {
        const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}?size=4096`;
        safeLocalStorage.setItem("avatar", avatarURL);
      }

      // Dispatch custom event for components to listen to
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: userData }),
      );

      return userData;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  })();

  toast.promise(loginPromise, {
    loading: "Logging you in...",
    success: (userData) => ({
      message: `Welcome back, ${userData.username}!`,
      description: "You have successfully signed in to your account.",
    }),
    error: (error) => ({
      message: "Login failed",
      description:
        error instanceof Error && error.name === "AbortError"
          ? "The request timed out. Please try again."
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred during login.",
    }),
  });

  try {
    const userData = await loginPromise;
    return { success: true, data: userData };
  } catch (error) {
    console.error("Token authentication error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to validate token",
    };
  }
}

export function isAuthenticated(): boolean {
  // Check localStorage for user data as a quick check
  // The actual validation happens through the session API
  const userData = safeLocalStorage.getItem("user");
  return !!userData;
}

export function getToken(): string | null {
  // Token is HttpOnly, so we can't access it from client-side
  // This function is deprecated and should not be used
  console.warn(
    "getToken() is deprecated - token is HttpOnly and cannot be accessed from client-side",
  );
  return null;
}
