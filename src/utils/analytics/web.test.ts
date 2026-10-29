import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

function setup(nodeEnv = "production", hostname = "jailbreakchangelogs.com") {
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  const window = {
    location: { pathname: "/values/calculator", hostname },
    screen: { width: 1440 },
  };
  let now = 1793160000000;
  let tick!: () => void;
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const beacons: Array<{ url: string; body: string }> = [];
  const navigator = {
    language: "en-GB",
    sendBeacon(url: string, body: string) {
      beacons.push({ url, body });
      return true;
    },
  };
  const exports = {} as typeof import("./web");
  const env = {
    NODE_ENV: nodeEnv,
    NEXT_PUBLIC_API_URL: "https://api.example.com/",
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./web.ts", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      window,
      document,
      navigator,
      process: { env },
      Intl,
      Date: { now: () => now },
      setInterval(callback: () => void, delay: number) {
        expect(tick).toBeUndefined();
        expect(delay).toBe(5000);
        tick = callback;
      },
      fetch(url: string, init: RequestInit) {
        requests.push({ url, init });
        return Promise.reject(new Error("offline"));
      },
    },
  );
  return {
    track: exports.trackWebEvent,
    requests,
    beacons,
    navigator,
    window,
    env,
    tick: () => tick(),
    hasTimer: () => tick !== undefined,
    advance: (ms: number) => (now += ms),
    hide() {
      document.visibilityState = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
    },
  };
}

test("local development and local production previews never start analytics", () => {
  for (const [nodeEnv, hostname] of [
    ["development", "jailbreakchangelogs.com"],
    ["test", "jailbreakchangelogs.com"],
    ["production", "localhost"],
    ["production", "127.0.0.1"],
    ["production", "[::1]"],
  ]) {
    const app = setup(nodeEnv, hostname);
    app.track("trade_scan");
    app.hide();
    expect(app.hasTimer()).toBe(false);
    expect(app.requests).toHaveLength(0);
    expect(app.beacons).toHaveLength(0);
  }
});

test("events batch with event-time paths, context, cookies and no IDs", async () => {
  const app = setup();
  app.track("trade_scan", { offering: 3, requesting: 2, parse_ms: 412 });
  app.window.location.pathname = "/trading";
  app.track("trade_scan_failed", { code: "no_items" });
  expect(app.requests).toHaveLength(0);
  app.tick();
  const { url, init } = app.requests[0];
  expect(url).toBe("https://api.example.com/v2/analytics/web");
  expect(init.credentials).toBe("include");
  expect(init.method).toBe("POST");
  const batch = JSON.parse(init.body as string);
  expect(batch.context).toEqual({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: "en-GB",
    screen_width: 1440,
  });
  expect(batch.events).toEqual([
    {
      name: "trade_scan",
      ts: 1793160000000,
      path: "/values/calculator",
      props: { offering: 3, requesting: 2, parse_ms: 412 },
    },
    {
      name: "trade_scan_failed",
      ts: 1793160000000,
      path: "/trading",
      props: { code: "no_items" },
    },
  ]);
  app.tick();
  expect(app.requests).toHaveLength(1);
  await Promise.resolve();
});

test("batches contain at most 50 events and hidden tabs send plain-text beacons", () => {
  const app = setup();
  for (let i = 0; i < 51; i++) app.track("trade_scan");
  app.tick();
  expect(JSON.parse(app.requests[0].init.body as string).events).toHaveLength(
    50,
  );
  app.hide();
  expect(JSON.parse(app.beacons[0].body).events).toHaveLength(1);
  expect(app.requests).toHaveLength(1);
  app.hide();
  expect(app.beacons).toHaveLength(1);
});

test("lookup paths omit searched usernames and IDs", () => {
  const app = setup();
  for (const pathname of [
    "/og/PrivateUsername",
    "/dupes/123456",
    "/inventories/PrivateUsername",
  ]) {
    app.window.location.pathname = pathname;
    app.track("og_search");
  }
  app.tick();
  const batch = JSON.parse(app.requests[0].init.body as string);
  expect(batch.events.map((event: { path: string }) => event.path)).toEqual([
    "/og/[user]",
    "/dupes/[user]",
    "/inventories/[user]",
  ]);
});

test("beacon rejection falls back to keepalive fetch and beacon exceptions are harmless", () => {
  const app = setup();
  app.navigator.sendBeacon = () => false;
  app.track("trade_scan");
  app.hide();
  expect(app.requests[0].init.keepalive).toBe(true);
  app.navigator.sendBeacon = () => {
    throw new Error("blocked");
  };
  app.track("trade_scan");
  expect(() => app.hide()).not.toThrow();
});

test("repeated visibility changes respect 30 requests per minute", () => {
  const app = setup();
  for (let i = 0; i < 31; i++) {
    app.track("trade_scan");
    app.hide();
  }
  expect(app.beacons).toHaveLength(30);
  app.advance(60_000);
  app.hide();
  expect(app.beacons).toHaveLength(31);
});

test("invalid events are dropped and a missing API URL never throws", () => {
  const app = setup();
  app.track("Trade Scan");
  app.track("x".repeat(65));
  app.track("trade_scan", { parse_ms: NaN });
  app.track(
    "trade_scan",
    Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`p${i}`, i])),
  );
  app.track("trade_scan");
  app.tick();
  expect(JSON.parse(app.requests[0].init.body as string).events).toHaveLength(
    1,
  );
  app.env.NEXT_PUBLIC_API_URL = "";
  app.track("trade_scan");
  expect(() => app.tick()).not.toThrow();
  expect(() => app.hide()).not.toThrow();
  expect(app.requests).toHaveLength(1);
});
