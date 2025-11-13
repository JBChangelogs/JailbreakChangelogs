/**
 * Idle Detection Manager
 * Detects user inactivity and manages WebSocket disconnection/reconnection
 */

type IdleCallback = () => void;
type ActiveCallback = () => void;

interface IdleDetectionStub {
  onIdle(callback: IdleCallback): void;
  onActive(callback: ActiveCallback): void;
  setIdleTime(idleTimeMs: number): void;
  getIdleTime(): number;
  isUserIdle(): boolean;
  forceIdle(): void;
  forceActive(): void;
  cleanup(): void;
}

export class IdleDetectionManager {
  private idleTimeout: NodeJS.Timeout | null = null;
  private idleTimeMs: number;
  private isIdle: boolean = false;
  private onIdleCallback: IdleCallback | null = null;
  private onActiveCallback: ActiveCallback | null = null;

  // Events that indicate user activity
  private readonly activityEvents = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
    "focus",
    "blur",
  ];

  constructor(idleTimeMs: number = 5 * 60 * 1000) {
    // Default: 5 minutes
    this.idleTimeMs = idleTimeMs;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (typeof window === "undefined") return;

    // Add activity event listeners
    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.handleActivity, true);
    });

    // Handle page visibility changes
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    // Start idle timer
    this.resetIdleTimer();
  }

  private handleActivity = (): void => {
    if (this.isIdle) {
      console.log("[IDLE] User became active");
      this.isIdle = false;
      this.onActiveCallback?.();
    }

    this.resetIdleTimer();
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Page became hidden - start idle timer immediately
      this.resetIdleTimer(1000); // 1 second delay for hidden pages
    } else {
      // Page became visible - user is active
      this.handleActivity();
    }
  };

  private resetIdleTimer(customDelay?: number): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    const delay = customDelay ?? this.idleTimeMs;

    this.idleTimeout = setTimeout(() => {
      if (!this.isIdle) {
        console.log("[IDLE] User went idle");
        this.isIdle = true;
        this.onIdleCallback?.();
      }
    }, delay);
  }

  public onIdle(callback: IdleCallback): void {
    this.onIdleCallback = callback;
  }

  public onActive(callback: ActiveCallback): void {
    this.onActiveCallback = callback;
  }

  public setIdleTime(idleTimeMs: number): void {
    this.idleTimeMs = idleTimeMs;
    this.resetIdleTimer();
  }

  public getIdleTime(): number {
    return this.idleTimeMs;
  }

  public isUserIdle(): boolean {
    return this.isIdle;
  }

  public forceIdle(): void {
    if (!this.isIdle) {
      console.log("[IDLE] Forcing idle state");
      this.isIdle = true;
      this.onIdleCallback?.();
    }
  }

  public forceActive(): void {
    if (this.isIdle) {
      console.log("[IDLE] Forcing active state");
      this.isIdle = false;
      this.onActiveCallback?.();
    }
    this.resetIdleTimer();
  }

  public cleanup(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    if (typeof window === "undefined") return;

    // Remove event listeners
    this.activityEvents.forEach((event) => {
      document.removeEventListener(event, this.handleActivity, true);
    });

    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
  }
}

// Singleton instance
let idleDetectionInstance: IdleDetectionManager | null = null;

export const getIdleDetection = ():
  | IdleDetectionManager
  | IdleDetectionStub => {
  if (typeof window === "undefined") {
    // Return a stub for SSR
    return {
      onIdle: () => {},
      onActive: () => {},
      setIdleTime: () => {},
      getIdleTime: () => 0,
      isUserIdle: () => false,
      forceIdle: () => {},
      forceActive: () => {},
      cleanup: () => {},
    };
  }

  if (!idleDetectionInstance) {
    idleDetectionInstance = new IdleDetectionManager();
  }

  return idleDetectionInstance;
};

export const idleDetection = getIdleDetection();
