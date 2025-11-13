"use client";

import { useState, useEffect } from "react";
import type { UserData } from "@/types/auth";
import { safeLocalStorage, safeSetJSON } from "./safeStorage";
import { wsKeepalive } from "./wsKeepalive";

// WebSocket message types
interface ConnectionIdMessage {
  type: "connection_id";
  id: string;
}

interface UserDataMessage {
  type: "data";
  data: UserData;
}

interface ErrorMessage {
  type: "error";
  error: string;
}

interface GetMessage {
  type: "get";
}

interface PongMessage {
  type: "pong";
  connection_id: string;
  latency: number | null;
  server_time: number;
}

type WebSocketMessage =
  | ConnectionIdMessage
  | UserDataMessage
  | ErrorMessage
  | PongMessage;

// Action map for handling different message types
const MESSAGE_HANDLERS = {
  connection_id: (manager: ClientSessionManager, message: WebSocketMessage) => {
    if (message.type === "connection_id") {
      console.log("[SESSION] Received connection_id message:", message.id);
      manager.setConnectionId(message.id);
    }
  },
  data: (manager: ClientSessionManager, message: WebSocketMessage) => {
    if (message.type === "data") {
      // Check if token is invalid
      if (
        typeof message.data === "string" &&
        message.data === "Invalid token"
      ) {
        console.log("[SESSION] Token invalidated by server");
        manager.handleTokenInvalidation();
      } else {
        manager.setUser(message.data);
        // Start ping cycle after receiving initial user data
        manager.startPingCycle();
      }
    }
  },
  error: (manager: ClientSessionManager, message: WebSocketMessage) => {
    if (message.type === "error") {
      console.log("[SESSION] Server error:", message.error);
      // Server will close connection after sending error, so we handle token invalidation
      manager.handleTokenInvalidation();
    }
  },
  pong: (manager: ClientSessionManager, message: WebSocketMessage) => {
    if (message.type === "pong") {
      wsKeepalive.handlePong(message);
      // Ensure connection ID cookie is still present
      manager.ensureConnectionIdCookie();
    }
  },
} as const;

type SessionListener = (user: UserData | null) => void;

class ClientSessionManager {
  private ws: WebSocket | null = null;
  private currentUser: UserData | null = null;
  private connectionId: string | null = null;
  private listeners: Set<SessionListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    // Load user from localStorage first
    this.loadUserFromStorage();
    this.connect();
  }

  private getToken(): string | null {
    // Extract token from cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "token") {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private setConnectionIdCookie(connectionId: string): void {
    // Set connection ID cookie with 30 day expiry
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const cookieString = `jbcl_connection_id=${encodeURIComponent(connectionId)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookieString;
    console.log("[SESSION] Setting connection ID cookie:", cookieString);

    // Verify cookie was set
    setTimeout(() => {
      const savedId = this.getConnectionIdFromCookie();
      console.log("[SESSION] Verified connection ID cookie:", savedId);
    }, 100);
  }

  private getConnectionIdFromCookie(): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "jbcl_connection_id") {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  public setConnectionId(connectionId: string): void {
    this.connectionId = connectionId;
    this.setConnectionIdCookie(connectionId);
    console.log("[SESSION] Connection ID set:", connectionId);
  }

  public ensureConnectionIdCookie(): void {
    // Check if we have a connection ID in memory but cookie is missing
    if (this.connectionId) {
      const cookieId = this.getConnectionIdFromCookie();
      if (!cookieId) {
        console.log(
          "[SESSION] Connection ID cookie missing, restoring:",
          this.connectionId,
        );
        this.setConnectionIdCookie(this.connectionId);
      }
    }
  }

  public validateTokenCookie(): void {
    // Check if token cookie still exists - if not, treat as invalidation
    const token = this.getToken();
    if (!token && this.currentUser) {
      console.log(
        "[SESSION] Token cookie missing while user logged in - treating as invalidation",
      );
      this.handleTokenInvalidation();
    }
  }

  public getConnectionId(): string | null {
    return this.connectionId || this.getConnectionIdFromCookie();
  }

  private loadUserFromStorage(): void {
    try {
      const storedUser = safeLocalStorage.getItem("user");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        console.log(
          "[SESSION] Loaded user from localStorage:",
          this.currentUser?.username,
        );
      }
    } catch (error) {
      console.error("[SESSION] Error loading user from localStorage:", error);
      safeLocalStorage.removeItem("user");
    }
  }

  private saveUserToStorage(user: UserData | null): void {
    if (user) {
      safeSetJSON("user", user);
      console.log("[SESSION] Saved user to localStorage:", user.username);
    } else {
      safeLocalStorage.removeItem("user");
      console.log("[SESSION] Removed user from localStorage");
    }
  }

  public sendPing(): void {
    wsKeepalive.sendPing();
  }

  public startPingCycle(): void {
    // Start the ping cycle after initial connection is established
    console.log("[SESSION] Starting ping cycle");
    wsKeepalive.startInitialPing();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public handleTokenInvalidation(): void {
    console.log(
      "[SESSION] Handling token invalidation - clearing all auth data",
    );

    // Clear token from cookies
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";

    // Clear user data from localStorage
    safeLocalStorage.removeItem("user");
    safeLocalStorage.removeItem("userid");
    safeLocalStorage.removeItem("avatar");

    // Set user to null and notify listeners
    this.setUser(null);

    // Disconnect WebSocket
    this.disconnect();

    // Dispatch auth state change event
    window.dispatchEvent(new CustomEvent("authStateChanged"));
  }

  public refreshUserData(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const getMessage: GetMessage = { type: "get" };
      this.ws.send(JSON.stringify(getMessage));
      console.log("[SESSION] Sent get request to refresh user data");
    } else {
      console.warn(
        "[SESSION] Cannot refresh user data - WebSocket not connected",
      );
    }
  }

  public async login(
    token: string,
  ): Promise<{ success: boolean; data?: UserData; error?: string }> {
    try {
      console.log("[SESSION] Starting login process...");

      // Get old token before replacing it
      const oldToken = this.getToken();

      // Invalidate old token on server if we have one
      if (oldToken && oldToken !== token) {
        try {
          console.log("[SESSION] Invalidating old token before login...");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/users/token/invalidate?session_token=${encodeURIComponent(oldToken)}`,
            {
              method: "POST",
              headers: {
                "User-Agent": "JailbreakChangelogs-Auth/1.0",
              },
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);
          console.log("[SESSION] Old token invalidated successfully");
        } catch (error) {
          console.error("[SESSION] Failed to invalidate old token:", error);
          // Continue with login even if old token invalidation fails
        }
      }

      // Set new token cookie
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // 30 days
      document.cookie = `token=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

      // Reconnect WebSocket to pick up new token
      this.reconnect();

      // Wait for WebSocket to validate the token and get user data
      const userData = await new Promise<UserData>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10; // 5 seconds total

        const checkConnection = () => {
          attempts++;

          // Check if we have user data (meaning WebSocket validated successfully)
          const storedUser = safeLocalStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              resolve(parsedUser);
              return;
            } catch {
              // Invalid user data, continue checking
            }
          }

          if (attempts >= maxAttempts) {
            reject(new Error("WebSocket authentication timeout"));
            return;
          }

          // Check again in 500ms
          setTimeout(checkConnection, 500);
        };

        // Start checking immediately
        checkConnection();
      });

      console.log("[SESSION] Login successful:", userData.username);
      return { success: true, data: userData };
    } catch (error) {
      console.error("[SESSION] Login failed:", error);

      // Clear the token cookie if authentication failed
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";

      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  public async logout(): Promise<void> {
    console.log("[SESSION] Starting logout process...");

    // Get token before clearing it
    const token = this.getToken();

    // Invalidate token on server if we have one
    if (token) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/token/invalidate?session_token=${encodeURIComponent(token)}`,
          {
            method: "POST",
            headers: {
              "User-Agent": "JailbreakChangelogs-Auth/1.0",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        console.log("[SESSION] Token invalidated on server");
      } catch (error) {
        console.error("[SESSION] Failed to invalidate token on server:", error);
        // Continue with local cleanup even if server invalidation fails
      }
    }

    // Clear all auth data
    safeLocalStorage.removeItem("user");
    safeLocalStorage.removeItem("userid");
    safeLocalStorage.removeItem("avatar");

    // Clear token cookie
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";

    // Set user to null and notify listeners
    this.setUser(null);

    // Disconnect WebSocket
    this.disconnect();

    // Dispatch auth state change event
    window.dispatchEvent(new CustomEvent("authStateChanged"));

    console.log("[SESSION] Logout complete");
  }

  private connect() {
    const token = this.getToken();
    if (!token) {
      console.log("[SESSION] No token found, setting user to null");
      this.setUser(null);
      return;
    }

    // Check for saved connection ID to reuse
    const savedConnectionId = this.getConnectionIdFromCookie();
    let wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/user?token=${encodeURIComponent(token)}`;

    if (savedConnectionId) {
      wsUrl += `&connection_id=${encodeURIComponent(savedConnectionId)}`;
      console.log("[SESSION] Reusing saved connection ID:", savedConnectionId);
    }

    try {
      console.log("[SESSION] Connecting to:", wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[SESSION] WebSocket connected");
        this.reconnectAttempts = 0;

        // Set up keepalive for this WebSocket connection
        wsKeepalive.setWebSocket(this.ws);
        // Don't send initial ping - wait for first pong to start ping cycle
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("[SESSION] Received message:", message);

          // Use action map to handle different message types
          const handler = MESSAGE_HANDLERS[message.type];
          if (handler) {
            handler(this, message);
          } else {
            console.warn("[SESSION] Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("[SESSION] Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = (event) => {
        console.log("[SESSION] WebSocket closed:", event.code, event.reason);
        this.ws = null;
        wsKeepalive.stopPingTimeout();

        // Only attempt reconnection for unexpected closures
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("[SESSION] WebSocket error:", error);
      };
    } catch (error) {
      console.error("[SESSION] Failed to create WebSocket connection:", error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[SESSION] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public setUser(user: UserData | null) {
    this.currentUser = user;
    this.saveUserToStorage(user);
    this.listeners.forEach((listener) => listener(user));
  }

  public getCurrentUser(): UserData | null {
    return this.currentUser;
  }

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current user
    listener(this.currentUser);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    wsKeepalive.cleanup();
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Singleton instance - only create on client side
let clientSessionInstance: ClientSessionManager | null = null;

// SSR-safe stub interface
interface ClientSessionStub {
  getCurrentUser(): UserData | null;
  subscribe(listener: (user: UserData | null) => void): () => void;
  login(
    token: string,
  ): Promise<{ success: boolean; data?: UserData; error?: string }>;
  logout(): Promise<void>;
  refreshUserData(): void;
  sendPing(): void;
  isConnected(): boolean;
  reconnect(): void;
  disconnect(): void;
  validateTokenCookie(): void;
}

export const getClientSession = ():
  | ClientSessionManager
  | ClientSessionStub => {
  if (typeof window === "undefined") {
    // Return a mock/stub for SSR
    return {
      getCurrentUser: () => null,
      subscribe: () => () => {},
      login: async () => ({ success: false, error: "SSR mode" }),
      logout: async () => {},
      refreshUserData: () => {},
      sendPing: () => {},
      isConnected: () => false,
      reconnect: () => {},
      disconnect: () => {},
      validateTokenCookie: () => {},
    };
  }

  if (!clientSessionInstance) {
    clientSessionInstance = new ClientSessionManager();
  }

  return clientSessionInstance;
};

// For backward compatibility
export const clientSession = getClientSession();

// Hook for React components
export function useSession() {
  const [user, setUser] = useState<UserData | null>(
    clientSession.getCurrentUser(),
  );

  useEffect(() => {
    return clientSession.subscribe(setUser);
  }, []);

  return {
    user,
    isLoading: user === null && clientSession.getCurrentUser() === null,
    reconnect: () => clientSession.reconnect(),
    refreshUserData: () => clientSession.refreshUserData(),
    login: (token: string) => clientSession.login(token),
    logout: () => clientSession.logout(),
  };
}
