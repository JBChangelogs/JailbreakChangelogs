import toast from "react-hot-toast";
import { UserData, AuthResponse } from "../types/auth";
// import { PUBLIC_API_URL } from '@/utils/api';
import { getCookie, hasValidToken, removeCookie } from "./cookies";

let lastLogoutSource: string = "Unknown";

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
    const hasToken = hasValidToken();
    return hasToken;
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
    // Show loading toast
    loadingToast = toast.loading("Logging you in...", {
      duration: Infinity,
      position: "bottom-right",
    });

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
    toast.success(`Welcome back, ${userData.username}!`, {
      duration: 3000,
      position: "bottom-right",
    });

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
    if (loadingToast) {
      toast.dismiss(loadingToast);
    }
  }
}

export function isAuthenticated(): boolean {
  return hasValidToken();
}

export function getToken(): string | null {
  return getCookie("token");
}
