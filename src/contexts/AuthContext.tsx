"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthState, UserData } from "@/types/auth";
import {
  validateAuth,
  logout as authLogout,
  trackLogoutSource,
} from "@/utils/auth";
import {
  safeGetJSON,
  safeSetJSON,
  safeLocalStorage,
} from "@/utils/safeStorage";
import { PUBLIC_API_URL } from "@/utils/api";
import { toast } from "sonner";
import { useRealtimeNotificationsWebSocket } from "@/hooks/useRealtimeNotificationsWebSocket";

// Helper function to track user status in Clarity
const trackUserStatus = (isAuthenticated: boolean, action?: string) => {
  if (typeof window !== "undefined" && window.clarity) {
    if (action === "logout") {
      window.clarity("set", "user_status", "logout");
    } else {
      window.clarity(
        "set",
        "user_status",
        isAuthenticated ? "authenticated" : "anonymous",
      );
    }
  }
};

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  loginModalTab: "discord" | "roblox";
  setLoginModal: (config: {
    open: boolean;
    tab?: "discord" | "roblox";
  }) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

function getJbclToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)jbcl_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<"discord" | "roblox">(
    "discord",
  );
  const isUserActiveRef = useRef(true);

  useRealtimeNotificationsWebSocket(
    (authState.isAuthenticated && !authState.isLoading) || !!getJbclToken(),
    pathname,
  );

  const initializeAuth = useCallback(async () => {
    try {
      // Fast path: non-HttpOnly cookie is client-readable — fetch user directly
      const token = getJbclToken();
      if (token && !safeGetJSON("user", null)) {
        try {
          const response = await fetch(
            `${PUBLIC_API_URL}/users/get/token?token=${encodeURIComponent(token)}`,
            { cache: "no-store" },
          );
          if (response.ok) {
            const user = (await response.json()) as UserData;
            safeSetJSON("user", user);
            safeLocalStorage.setItem("userid", user.id);
            if (user.avatar) {
              safeLocalStorage.setItem(
                "avatar",
                `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=4096`,
              );
            }
            setAuthState({
              isAuthenticated: true,
              user,
              isLoading: false,
              error: null,
            });
            trackUserStatus(true);
            return;
          }
        } catch {
          // fall through to existing flow
        }
      }

      // Check if we have user data in localStorage first
      const userData = safeGetJSON("user", null);
      if (userData) {
        // Validate the session to ensure it's still valid
        const isValid = await validateAuth();
        if (isValid) {
          // Re-read user data after validateAuth() to get any updates (e.g., Roblox fields)
          const freshUserData = safeGetJSON("user", null);
          setAuthState({
            isAuthenticated: true,
            user: freshUserData || userData,
            isLoading: false,
            error: null,
          });

          // Track user status in Clarity
          trackUserStatus(true);
          return;
        }
      }

      // If no user data or validation failed, try to validate auth anyway
      // This will check the HttpOnly cookie via the session API
      const isValid = await validateAuth();
      if (isValid) {
        const freshUserData = safeGetJSON("user", null);
        if (freshUserData) {
          setAuthState({
            isAuthenticated: true,
            user: freshUserData,
            isLoading: false,
            error: null,
          });

          // Track user status in Clarity
          trackUserStatus(true);
          return;
        }
      }

      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });

      // Track user status in Clarity
      trackUserStatus(false);
    } catch (err) {
      console.error("Auth initialization error:", err);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: "Failed to initialize auth",
      });

      // Track user status in Clarity
      trackUserStatus(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      initializeAuth();
    }, 0);

    let idleTimeout: NodeJS.Timeout;
    let authInterval: NodeJS.Timeout;

    // Function to mark user as active
    const markUserActive = () => {
      isUserActiveRef.current = true;

      // Clear existing idle timeout
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }

      // Set new idle timeout (8 minutes of inactivity - shorter than auth check interval)
      idleTimeout = setTimeout(() => {
        isUserActiveRef.current = false;
      }, 480000); // 8 minutes
    };

    // Function to start auth interval
    const startAuthInterval = () => {
      if (authInterval) {
        clearInterval(authInterval);
      }

      authInterval = setInterval(() => {
        if (isUserActiveRef.current) {
          validateAuth().catch((error) => {
            console.error("Auth validation error:", error);
          });
        }
      }, 600000); // Check every 10 minutes when active (reduced frequency)
    };

    // Set up activity listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      document.addEventListener(event, markUserActive, true);
    });

    // Mark user as initially active and start auth interval
    markUserActive();
    startAuthInterval();

    // Listen for auth state changes to update local state
    const handleAuthChange: EventListener = (event) => {
      const userData = (event as CustomEvent<UserData | null>).detail;
      if (userData) {
        setAuthState({
          isAuthenticated: true,
          user: userData,
          isLoading: false,
          error: null,
        });
        // Track user status in Clarity
        trackUserStatus(true);
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
        // Track user status in Clarity
        trackUserStatus(false);
      }
    };

    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      if (authInterval) {
        clearInterval(authInterval);
      }
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }

      // Remove activity listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, markUserActive, true);
      });

      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, [initializeAuth]);

  // Handle URL-driven login modal opening (e.g. ?login=true)
  useEffect(() => {
    if (typeof window === "undefined" || authState.isLoading) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const loginParam = urlParams.get("login");
    const shouldOpenLoginFromUrl =
      loginParam !== null &&
      loginParam.toLowerCase() !== "false" &&
      loginParam !== "0";

    if (shouldOpenLoginFromUrl && !authState.isAuthenticated) {
      setTimeout(() => {
        setShowLoginModal(true);
      }, 0);

      // Clear login param after opening to avoid reopening on refresh/navigation
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("login");
      window.history.replaceState({}, "", currentUrl.toString());
    } else if (shouldOpenLoginFromUrl && authState.isAuthenticated) {
      toast.info("You are already logged in", {
        duration: 3000,
      });

      // Delay cleanup slightly so the toast reliably renders first
      setTimeout(() => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("login");
        window.history.replaceState({}, "", currentUrl.toString());
      }, 1000);
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("token")) return;
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleLogout = async () => {
    try {
      trackLogoutSource("AuthContext");
      await authLogout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });

      // Track user status in Clarity
      trackUserStatus(false, "logout");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      // Errors are now handled by toast.promise in authLogout()
    }
  };

  const setLoginModal = useCallback(
    ({ open, tab }: { open: boolean; tab?: "discord" | "roblox" }) => {
      if (tab) {
        setLoginModalTab(tab);
      }
      setShowLoginModal(open);
    },
    [],
  );

  const contextValue: AuthContextType = {
    ...authState,
    logout: handleLogout,
    loginModalTab,
    setLoginModal,
    showLoginModal,
    setShowLoginModal,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

/**
 * Safe version of useAuthContext that returns undefined when context is not available.
 * Useful for components that may render during SSR before AuthProvider is available.
 */
export function useSafeAuthContext(): AuthContextType | undefined {
  return useContext(AuthContext);
}

// Hook for components that only need to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}

// Utility function to get current user's premium type
export const getCurrentUserPremiumType = (): number => {
  if (typeof window === "undefined") return 0;

  try {
    const userData = safeGetJSON<UserData>("user", null);
    if (userData) {
      return userData.premiumtype || 0;
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  return 0;
};
