type WebEvent = {
  name: string;
  ts: number;
  path: string;
  props: Record<string, string | number | boolean>;
};

const queue: WebEvent[] = [];
let started = false;
let sentAt: number[] = [];

function flush(beacon = false) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl || queue.length === 0) return;
    const now = Date.now();
    sentAt = sentAt.filter((ts) => now - ts < 60_000);
    if (sentAt.length >= 30) return;

    const url = `${baseUrl.replace(/\/$/, "")}/v2/analytics/web`;
    const body = JSON.stringify({
      context: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language.slice(0, 16),
        screen_width: Math.min(65535, Math.max(0, window.screen.width)),
      },
      events: queue.splice(0, 50),
    });
    sentAt.push(now);
    if (beacon && navigator.sendBeacon?.(url, body)) return;
    void fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function trackWebEvent(
  name: string,
  props: WebEvent["props"] = {},
): void {
  try {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) ||
      !/^[a-z0-9_]{1,64}$/.test(name)
    )
      return;
    if (
      Object.keys(props).length > 10 ||
      Object.values(props).some(
        (value) =>
          !["string", "number", "boolean"].includes(typeof value) ||
          (typeof value === "number" && !Number.isFinite(value)),
      )
    )
      return;

    if (!started) {
      setInterval(flush, 5000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush(true);
      });
      started = true;
    }
    if (queue.length >= 500) return;
    queue.push({
      name,
      ts: Date.now(),
      path: window.location.pathname
        .replace(/^\/(og|dupes|inventories)\/[^/]+/, "/$1/[user]")
        .slice(0, 512),
      props,
    });
  } catch {}
}
