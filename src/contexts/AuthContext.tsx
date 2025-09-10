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
import { AuthState, AuthResponse } from "@/types/auth";
import {
  validateAuth,
  logout as authLogout,
  handleTokenAuth,
  trackLogoutSource,
} from "@/utils/auth";
import { hasValidToken } from "@/utils/cookies";
import {
  getStoredCampaign,
  clearStoredCampaign,
  countCampaignVisit,
} from "@/utils/campaign";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      if (hasValidToken()) {
        const isValid = await validateAuth();
        if (isValid) {
          const userData = localStorage.getItem("user");
          if (userData) {
            setAuthState({
              isAuthenticated: true,
              user: JSON.parse(userData),
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
      // Show loading toast
      loadingToast = toast.loading("Logging you out...", {
        duration: Infinity,
        position: "bottom-right",
      });

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
      toast.success("Successfully logged out!", {
        duration: 3000,
        position: "bottom-right",
      });
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to log out. Please try again.", {
        duration: 3000,
        position: "bottom-right",
      });
    } finally {
      // Always dismiss the loading toast
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
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

// Hook for components that only need to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}

// Utility function to get current user's premium type
export const getCurrentUserPremiumType = (): number => {
  if (typeof window === "undefined") return 0;

  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      return userData.premiumtype || 0;
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  return 0;
};
