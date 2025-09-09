import toast from "react-hot-toast";
import { UserData, AuthResponse } from "../types/auth";
import { PUBLIC_API_URL } from "@/utils/api";
import { setCookie, getCookie, hasValidToken, removeCookie } from "./cookies";

let lastLogoutSource: string = "Unknown";

export function trackLogoutSource(source: string) {
  lastLogoutSource = source;
}

export async function logout() {
  // Get token from cookie
  const token = getCookie("token");
  const source = lastLogoutSource || "Direct API Call";

  // Only try to invalidate token if we have one
  if (token && token !== "undefined") {
    try {
      console.group("🔐 Token Invalidation Process");
      console.log("📝 Logout Details:", {
        Source: source,
        "Token Length": token.length,
        Timestamp: new Date().toISOString(),
      });

      // Invalidate token on server
      const response = await fetch(
        `${PUBLIC_API_URL}/users/token/invalidate?session_token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        console.log("✅ Token Successfully Invalidated:", {
          Source: source,
          Timestamp: new Date().toISOString(),
          "Response Status": response.status,
        });
        // Only clear data if token invalidation was successful
        clearAuthData("user-initiated logout");
      } else {
        const errorData = await response.json().catch(() => null);
        console.error("❌ Token Invalidation Failed:", {
          Source: source,
          Timestamp: new Date().toISOString(),
          Status: response.status,
          "Status Text": response.statusText,
          "Error Details": errorData || "No error details available",
          "Token Length": token.length,
        });
        throw new Error("Failed to invalidate token");
      }
      console.groupEnd();
    } catch (error) {
      console.error("❌ Error During Logout:", {
        Source: source,
        Timestamp: new Date().toISOString(),
        "Error Message":
          error instanceof Error ? error.message : "Unknown error",
        "Stack Trace": error instanceof Error ? error.stack : undefined,
        "Token Length": token.length,
      });
      console.groupEnd();
      throw error;
    }
  } else {
    console.group("🔐 Token Invalidation Process");
    console.log("⚠️ No Token Found:", {
      Source: source,
      Timestamp: new Date().toISOString(),
    });
    console.groupEnd();
    // If no token exists, just clear the data
    clearAuthData("no token found");
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

export async function validateAuth(): Promise<boolean> {
  // Check if token exists in cookie
  const token = getCookie("token");

  if (!token || token === "undefined") {
    console.log("Auth validation failed: No valid token found in cookies");
    clearAuthData("auth validation failed");
    return false;
  }

  let attempts = 0;
  const maxAttempts = 3;
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  while (attempts < maxAttempts) {
    try {
      console.log(
        `Attempting authentication (${attempts + 1}/${maxAttempts})...`,
      );

      // Validate token with server
      const response = await fetch(
        `${PUBLIC_API_URL}/users/get/token?token=${token}&nocache=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        console.log("Authentication successful!");
        const userData = await response.json();

        // Update localStorage with fresh data
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

        return true;
      }

      // Only clear auth data if we get an auth-related error
      if (response.status === 403) {
        const errorData = await response.json().catch(() => null);
        console.error("Auth validation failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData || "No error details available",
          timestamp: new Date().toISOString(),
        });
        clearAuthData("auth validation failed - token expired or invalid");
        return false;
      }

      // For other status codes, increment attempts and retry
      attempts++;
      const errorData = await response.json().catch(() => null);
      console.warn(
        `Auth validation attempt ${attempts}/${maxAttempts} failed:`,
        {
          status: response.status,
          statusText: response.statusText,
          error: errorData || "No error details available",
        },
      );

      if (attempts < maxAttempts) {
        const nextDelay = 1000 * attempts;
        console.log(`Retrying in ${nextDelay}ms...`);
        await delay(nextDelay);
      }
    } catch (error) {
      // Network or other errors - don't clear auth data
      attempts++;
      console.error(
        `Auth validation error (attempt ${attempts}/${maxAttempts}):`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      );

      if (attempts < maxAttempts) {
        const nextDelay = 1000 * attempts;
        console.log(`Retrying in ${nextDelay}ms...`);
        await delay(nextDelay);
      }
    }
  }

  // If we've exhausted all attempts but it was due to network errors,
  // keep the user logged in and return true to maintain their session
  if (navigator && !navigator.onLine) {
    console.log(
      "Auth validation failed due to being offline - keeping user logged in",
    );
    return true;
  }

  // If we're online and exhausted all attempts, something is wrong with the API
  console.error(
    "Auth validation failed after all retry attempts, but keeping user logged in since it may be an API issue",
  );
  return true;
}

export async function handleTokenAuth(token: string): Promise<AuthResponse> {
  let loadingToast: string | undefined;

  try {
    // Show loading toast
    loadingToast = toast.loading("Logging you in...", {
      duration: Infinity,
      position: "bottom-right",
    });

    // Validate token with server
    const response = await fetch(
      `${PUBLIC_API_URL}/users/get/token?token=${token}&nocache=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to validate token");
    }

    const userData: UserData = await response.json();

    // Set cookie with proper attributes
    setCookie("token", token);

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
