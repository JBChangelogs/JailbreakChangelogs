/**
 * WebSocket Keepalive Manager
 * Handles ping/pong functionality to keep WebSocket connections alive
 */

interface PingMessage {
  type: "ping";
}

interface PongMessage {
  type: "pong";
  connection_id: string;
  latency: number | null;
  server_time: number;
}

export class WebSocketKeepalive {
  private pingTimeout: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL_MS = 30000; // 30 seconds

  constructor(private ws: WebSocket | null = null) {}

  public setWebSocket(ws: WebSocket | null): void {
    this.ws = ws;
  }

  public sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Check token cookie before sending ping
      this.validateTokenBeforePing();

      const pingMessage: PingMessage = { type: "ping" };
      this.ws.send(JSON.stringify(pingMessage));
      console.log("[KEEPALIVE] Sent ping");
    }
  }

  private validateTokenBeforePing(): void {
    // Import clientSession to validate token
    if (typeof window !== "undefined") {
      import("./clientSession").then(({ clientSession }) => {
        clientSession.validateTokenCookie();
      });
    }
  }

  public handlePong(pongMessage: PongMessage): void {
    console.log("[KEEPALIVE] Received pong:", {
      connection_id: pongMessage.connection_id,
      latency: pongMessage.latency,
      server_time: pongMessage.server_time,
    });

    this.scheduleNextPing(pongMessage.server_time);
  }

  public scheduleNextPing(serverTime: number): void {
    // Clear any existing timeout
    this.stopPingTimeout();

    // Calculate when to send next ping (30 seconds from server time)
    const nextPingTime = serverTime + this.PING_INTERVAL_MS;
    const currentTime = Date.now();
    const delay = Math.max(0, nextPingTime - currentTime);

    console.log(
      `[KEEPALIVE] Scheduling next ping in ${delay}ms (server-based timing)`,
    );

    this.pingTimeout = setTimeout(() => {
      this.sendPing();
    }, delay);
  }

  public startInitialPing(): void {
    // Schedule first ping 30 seconds after initial connection is established
    console.log("[KEEPALIVE] Scheduling first ping in 30 seconds");
    setTimeout(() => {
      this.sendPing();
    }, this.PING_INTERVAL_MS); // 30 seconds
  }

  public stopPingTimeout(): void {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  public cleanup(): void {
    this.stopPingTimeout();
    this.ws = null;
  }
}

// Singleton instance for global use
export const wsKeepalive = new WebSocketKeepalive();
