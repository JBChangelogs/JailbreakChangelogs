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
import { AuthState, AuthResponse, UserData } from "@/types/auth";
import {
  validateAuth,
  logout as authLogout,
  handleTokenAuth,
  trackLogoutSource,
  showLogoutToast,
  showLogoutLoadingToast,
  dismissLogoutLoadingToast,
} from "@/utils/auth";
// Removed hasValidToken import - using session API instead
import {
  getStoredCampaign,
  clearStoredCampaign,
  countCampaignVisit,
  storeCampaign,
} from "@/utils/campaign";
import { safeGetJSON } from "@/utils/safeStorage";
import toast from "react-hot-toast";

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
  login: (token: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isUserActiveRef = useRef(true);

  const initializeAuth = useCallback(async () => {
    try {
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

          // Clear any stored campaign data
          clearStoredCampaign();
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

          // Clear any stored campaign data
          clearStoredCampaign();
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

      // Check for campaign parameter in URL and show login modal if not authenticated
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const campaign = urlParams.get("campaign");
        if (campaign) {
          storeCampaign(campaign);
          setShowLoginModal(true);
        }
      }
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
    initializeAuth();

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
        const now = new Date().toISOString();
        console.log(`[${now}] User marked as idle - pausing auth checks`);
        isUserActiveRef.current = false;
      }, 480000); // 8 minutes
    };

    // Function to start auth interval
    const startAuthInterval = () => {
      if (authInterval) {
        clearInterval(authInterval);
      }

      authInterval = setInterval(() => {
        const now = new Date().toISOString();
        if (isUserActiveRef.current) {
          console.log(`[${now}] Running auth validation...`);
          validateAuth().catch((error) => {
            console.error("Auth validation error:", error);
          });
        } else {
          console.log(`[${now}] Skipping auth validation - user is idle`);
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
    const handleAuthChange = (event: CustomEvent) => {
      const userData = event.detail;
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

    window.addEventListener(
      "authStateChanged",
      handleAuthChange as EventListener,
    );

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

      window.removeEventListener(
        "authStateChanged",
        handleAuthChange as EventListener,
      );
    };
  }, [initializeAuth]);

  // Separate effect for campaign detection
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !authState.isAuthenticated &&
      !authState.isLoading
    ) {
      const urlParams = new URLSearchParams(window.location.search);
      const campaign = urlParams.get("campaign");
      if (campaign) {
        storeCampaign(campaign);
        setShowLoginModal(true);
      }
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  const handleLogin = async (token: string): Promise<AuthResponse> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const response = await handleTokenAuth(token);

      if (response.success && response.data) {
        setAuthState({
          isAuthenticated: true,
          user: response.data,
          isLoading: false,
          error: null,
        });

        // Track user status in Clarity
        trackUserStatus(true);

        // Check for campaign and count visit after successful login
        const campaign = getStoredCampaign();
        if (campaign) {
          await countCampaignVisit(campaign, token);
          toast.success("Campaign visit recorded!", {
            duration: 3000,
            position: "bottom-right",
          });
          clearStoredCampaign();
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: response.error || "Login failed",
        });

        // Track user status in Clarity
        trackUserStatus(false);
      }

      return response;
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
      });

      // Track user status in Clarity
      trackUserStatus(false);
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = async () => {
    let loadingToast: string | undefined;

    try {
      // Show loading toast with deduplication
      loadingToast = showLogoutLoadingToast();

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

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      showLogoutToast();
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to log out. Please try again.", {
        duration: 3000,
        position: "bottom-right",
      });
    } finally {
      // Always dismiss the loading toast
      dismissLogoutLoadingToast(loadingToast);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
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
