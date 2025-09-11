import toast from "react-hot-toast";
import { UserData, AuthResponse } from "../types/auth";
// import { PUBLIC_API_URL } from '@/utils/api';
import { removeCookie } from "./cookies";

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

    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to clear session");
    }

    clearAuthData("user-initiated logout");
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

function clearAuthData(reason: string) {
  console.log(`Clearing auth data. Reason: ${reason}`);

  removeCookie("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userid");
  localStorage.removeItem("avatar");

  // Dispatch custom event for components to listen to
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
    const userData = localStorage.getItem("user");
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
  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    const { user } = (await response.json()) as { user: UserData | null };
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userid", user.id);
      if (user.avatar) {
        const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=4096`;
        localStorage.setItem("avatar", avatarURL);
      }
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: user }),
      );
      return true;
    }
    clearAuthData("session not found");
    return false;
  } catch {
    // On errors, do not log out; keep previous state
    return true;
  }
}

export async function handleTokenAuth(token: string): Promise<AuthResponse> {
  let loadingToast: string | undefined;

  try {
    // Show loading toast with deduplication
    loadingToast = showLoginLoadingToast();

    // Validate token and set cookie via server route
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Failed to validate token");
    }

    const userData: UserData = await response.json();

    // Set local storage
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userid", userData.id);

    // Set avatar if available
    if (userData.avatar) {
      const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}?size=4096`;
      localStorage.setItem("avatar", avatarURL);
    }

    // Dispatch custom event for components to listen to
    window.dispatchEvent(
      new CustomEvent("authStateChanged", { detail: userData }),
    );

    // Dismiss loading toast and show success
    toast.dismiss(loadingToast);
    showWelcomeToast(userData.username);

    return { success: true, data: userData };
  } catch (error) {
    console.error("Token authentication error:", error);
    toast.error("Failed to log in. Please try again.", {
      duration: 3000,
      position: "bottom-right",
    });
    return { success: false, error: "Failed to validate token" };
  } finally {
    // Always dismiss the loading toast
    dismissLoginLoadingToast(loadingToast);
  }
}

export function isAuthenticated(): boolean {
  // Check localStorage for user data as a quick check
  // The actual validation happens through the session API
  const userData = localStorage.getItem("user");
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
