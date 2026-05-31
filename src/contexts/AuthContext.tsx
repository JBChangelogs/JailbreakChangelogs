"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { AuthState, UserData } from "@/types/auth";
import { logout as authLogout, trackLogoutSource } from "@/utils/auth/auth";
import {
  safeGetJSON,
  safeSetJSON,
  safeLocalStorage,
} from "@/utils/storage/safeStorage";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { trackEvent, trackClearUserId } from "@/utils/analytics/rybbit";
import type { BanInfo } from "@/utils/api/ban";
import { toast } from "sonner";
import { useRealtimeNotificationsWebSocket } from "@/hooks/useRealtimeNotificationsWebSocket";
import { createLogger } from "@/services/logger";

const log = createLogger("AUTH");

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  loginModalTab: "discord" | "roblox";
  setLoginModal: (config: {
    open: boolean;
    tab?: "discord" | "roblox";
    onlyRoblox?: boolean;
  }) => void;
  loginModalOnlyRoblox: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  bans: Record<string, BanInfo>;
  setBan: (ban: BanInfo) => void;
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

function LocationTracker({
  onLocationChange,
}: {
  onLocationChange: (path: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    onLocationChange(pathname + (search ? "?" + search : ""));
  }, [pathname, searchParams, onLocationChange]);

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [locationString, setLocationString] = useState<string>("/");
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
  const [loginModalOnlyRoblox, setLoginModalOnlyRoblox] = useState(false);
  const [bans, setBansMap] = useState<Record<string, BanInfo>>({});
  const setBan = useCallback((ban: BanInfo) => {
    if (ban.expiresAt > 0) {
      const ms = ban.expiresAt * 1000 - Date.now();
      if (ms <= 0) return; // already expired, don't store
      setBansMap((prev) => ({ ...prev, [ban.banType]: ban }));
      setTimeout(() => {
        setBansMap((prev) => {
          if (prev[ban.banType]?.expiresAt !== ban.expiresAt) return prev;
          const next = { ...prev };
          delete next[ban.banType];
          return next;
        });
      }, ms);
    } else {
      // permanent ban
      setBansMap((prev) => ({ ...prev, [ban.banType]: ban }));
    }
  }, []);
  const isUserActiveRef = useRef(true);

  useRealtimeNotificationsWebSocket(
    (authState.isAuthenticated && !authState.isLoading) || !!getJbclToken(),
    locationString,
  );

  const initializeAuth = useCallback(async () => {
    try {
      const token = getJbclToken();

      if (!token) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Show cached user immediately so the navbar renders without a flash
      const cachedUser = safeGetJSON<UserData>("user", null);
      if (cachedUser) {
        setAuthState({
          isAuthenticated: true,
          user: cachedUser,
          isLoading: false,
          error: null,
        });
      }

      // Refresh from token lookup in the background
      try {
        const response = await fetch(
          `${PUBLIC_API_URL}/users/get/token?token=${encodeURIComponent(token)}`,
          {
            cache: "no-store",
            credentials: "include",
          },
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
        } else {
          // Token is invalid — clear state
          safeSetJSON("user", null);
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch {
        // Network error — keep showing cached user if we have one
        if (!cachedUser) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      }
    } catch (err) {
      log.error("Auth initialization error", err);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: "Failed to initialize auth",
      });
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
          initializeAuth().catch((error) => {
            log.error("Auth validation error", error);
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
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
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
    if (window.location.hostname !== "localhost") return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (!token) return;
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) void initializeAuth();
      })
      .catch((e) => log.error("Dev login fetch error", e));
  }, [initializeAuth]);

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
      setBansMap({});

      trackEvent("User Logout");
      trackClearUserId();

      router.refresh();
    } catch (err) {
      log.error("Logout error", err);
      // Errors are now handled by toast.promise in authLogout()
    }
  };

  const setLoginModal = useCallback(
    ({
      open,
      tab,
      onlyRoblox,
    }: {
      open: boolean;
      tab?: "discord" | "roblox";
      onlyRoblox?: boolean;
    }) => {
      if (tab) {
        setLoginModalTab(tab);
      }
      setLoginModalOnlyRoblox(onlyRoblox ?? false);
      setShowLoginModal(open);
    },
    [],
  );

  const contextValue: AuthContextType = {
    ...authState,
    logout: handleLogout,
    loginModalTab,
    loginModalOnlyRoblox,
    setLoginModal,
    showLoginModal,
    setShowLoginModal,
    bans,
    setBan,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <Suspense fallback={null}>
        <LocationTracker onLocationChange={setLocationString} />
      </Suspense>
      {children}
    </AuthContext.Provider>
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
    log.error("Error parsing user data", error);
  }

  return 0;
};
