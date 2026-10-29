import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

type ToastOptions = { action: { onClick: () => void }; description: string };

function setupRealtime(
  options: {
    active?: boolean;
    path?: string;
    sender?: () => Promise<string | null>;
    appConnected?: () => Promise<boolean>;
  } = {},
) {
  const effects: (() => (() => void) | void)[] = [];
  const toasts: { title: string; options: ToastOptions }[] = [];
  const desktop: {
    title: string;
    body: string;
    target: { internalPath: string };
  }[] = [];
  const errors: unknown[] = [];
  const events: { type: string }[] = [];
  const destinations: string[] = [];
  const dismissed: (string | undefined)[] = [];
  const windowListeners = new Map<string, Set<(event: unknown) => void>>();
  const emit = (type: string, detail?: unknown) => {
    for (const listener of windowListeners.get(type) ?? [])
      listener({ type, detail });
  };
  let lookups = 0;
  const listeners = new Map<
    string,
    (event: { data: string }) => Promise<void>
  >();
  const queryClient = {
    fetchQuery: () => options.appConnected?.() ?? Promise.resolve(false),
  };
  const noop = () => {};
  class Socket {
    static OPEN = 1;
    static CONNECTING = 0;
    readyState = 1;
    addEventListener(
      name: string,
      callback: (event: { data: string }) => Promise<void>,
    ) {
      listeners.set(name, callback);
    }
    close() {}
    send() {}
  }
  const exports = {} as typeof import("./useRealtimeNotificationsWebSocket");
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useRealtimeNotificationsWebSocket.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      WebSocket: Socket,
      Audio: class {
        play() {
          return Promise.resolve();
        }
      },
      navigator: { onLine: true },
      document: {
        visibilityState: "visible",
        addEventListener: noop,
        removeEventListener: noop,
      },
      window: {
        location: {
          pathname: options.path ?? "/values",
          search: "",
          assign: (path: string) => destinations.push(path),
        },
        addEventListener: (
          type: string,
          listener: (event: unknown) => void,
        ) => {
          if (!windowListeners.has(type)) windowListeners.set(type, new Set());
          windowListeners.get(type)!.add(listener);
        },
        removeEventListener: (
          type: string,
          listener: (event: unknown) => void,
        ) => windowListeners.get(type)?.delete(listener),
        dispatchEvent: (event: { type: string; detail: unknown }) => {
          events.push(event);
          emit(event.type, event.detail);
        },
      },
      CustomEvent: class {
        readonly detail: unknown;
        constructor(
          readonly type: string,
          options?: { detail?: unknown },
        ) {
          this.detail = options?.detail;
        }
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      require: (name: string) => {
        if (name === "react")
          return {
            useCallback: (callback: unknown) => callback,
            useRef: (current: unknown) => ({ current }),
            useEffect: (effect: () => (() => void) | void) =>
              effects.push(effect),
          };
        if (name === "@tanstack/react-query")
          return { useQueryClient: () => queryClient };
        if (name === "sonner")
          return {
            toast: Object.assign(
              (title: string, options: ToastOptions) =>
                toasts.push({ title, options }),
              { warning: noop, dismiss: noop },
            ),
          };
        if (name === "@/utils/api/api")
          return {
            ENABLE_REALTIME_NOTIFICATIONS_WS: true,
            WS_URL: "wss://api.example.test",
          };
        if (name === "@/utils/api/apiDevToken")
          return { buildApiWsUrl: () => "wss://api.example.test/realtime" };
        if (name === "@/services/logger")
          return {
            createLogger: () => ({
              warn: noop,
              info: noop,
              error: (...args: unknown[]) => errors.push(args),
            }),
          };
        if (name === "@/utils/notifications/realtimeConnectionNotice")
          return {
            createRealtimeConnectionNotice: () => ({
              reset: noop,
              unavailable: noop,
            }),
          };
        if (name === "@/utils/notifications/messageSender")
          return {
            cachedMessageUsername: () => null,
            resolveMessageSenderName: () => {
              lookups++;
              return options.sender?.() ?? Promise.resolve("Sencha");
            },
          };
        if (name === "@/utils/notifications/desktopNotifications")
          return {
            isNotificationPageActive: () => options.active ?? true,
            shouldShowDesktopNotification: () => options.active === false,
            showDesktopNotification: (input: (typeof desktop)[number]) =>
              desktop.push(input),
            dismissMessageDesktopNotifications: (path?: string) =>
              dismissed.push(path),
          };
        if (name === "@/utils/messages/mentions")
          return { mentionsToText: (text: string) => text };
        if (name === "@/utils/notifications/notifMarkdown")
          return { formatNotifPlainText: (text: string) => text };
        return new Proxy({}, { get: () => noop });
      },
    },
  );
  exports.useRealtimeNotificationsWebSocket(
    true,
    options.path ?? "/values",
    undefined,
    undefined,
    "viewer",
  );
  const cleanups = effects.map((effect) => effect());
  const cleanup = () => {
    for (const effectCleanup of cleanups.toReversed()) effectCleanup?.();
  };
  return {
    cleanup,
    toasts,
    desktop,
    events,
    destinations,
    dismissed,
    emit,
    errors,
    lookups: () => lookups,
    receive: async (payload: unknown) => {
      await listeners.get("message")!({ data: JSON.stringify(payload) });
      await Promise.resolve();
      expect(errors).toEqual([]);
    },
  };
}

const dm = {
  action: "message_received",
  data: {
    id: "message",
    user_id: "sender",
    recipient_id: "viewer",
    content: "Hello",
  },
};
const group = {
  action: "group_message_received",
  data: {
    id: "message",
    sender_id: "sender",
    group_id: "group",
    content: "Hello group",
  },
};

test.each([
  [true, dm],
  [true, group],
  [false, dm],
  [false, group],
] as const)(
  "incoming message alerts use server text without sender lookups (active: %s, event: %j)",
  async (active, payload) => {
    for (const body of [
      "hey @_frankish and @Unknown User",
      "",
      'renamed the group to "x"',
    ]) {
      const realtime = setupRealtime({ active });
      const title =
        payload === dm ? "piotrekk5372" : "piotrekk5372 (Trading Pals)";
      try {
        await realtime.receive({
          ...payload,
          data: {
            ...payload.data,
            notification: { title, body },
          },
        });
        expect(realtime.lookups()).toBe(0);
        if (active) {
          expect(realtime.toasts).toHaveLength(1);
          expect(realtime.toasts[0].title).toBe(`New message from ${title}`);
          expect(realtime.toasts[0].options.description).toBe(body);
        } else {
          expect(realtime.desktop).toHaveLength(1);
          expect(realtime.desktop[0].title).toBe(`New message from ${title}`);
          expect(realtime.desktop[0].body).toBe(body);
        }
      } finally {
        realtime.cleanup();
      }
    }
  },
);

test("DM and group message toasts and desktop alerts use sender names and keep chat links", async () => {
  for (const active of [true, false]) {
    const realtime = setupRealtime({ active });
    try {
      await realtime.receive(dm);
      await realtime.receive(group);
      const titles = ["Message from Sencha", "Sencha in a group chat"];
      expect(realtime.lookups()).toBe(2);
      if (active) {
        expect(realtime.toasts.map((toast) => toast.title)).toEqual(titles);
        expect(
          realtime.toasts.map((toast) => toast.options.description),
        ).toEqual(["Hello", "Hello group"]);
        expect(realtime.desktop).toEqual([]);
        for (const toast of realtime.toasts) toast.options.action.onClick();
        expect(realtime.destinations).toEqual([
          "/messages/sender",
          "/messages/group/group",
        ]);
      } else {
        expect(
          realtime.desktop.map((notification) => notification.title),
        ).toEqual(titles);
        expect(
          realtime.desktop.map((notification) => notification.body),
        ).toEqual(["Hello", "Hello group"]);
        expect(
          realtime.desktop.map(
            (notification) => notification.target.internalPath,
          ),
        ).toEqual(["/messages/sender", "/messages/group/group"]);
        expect(realtime.toasts).toEqual([]);
      }
    } finally {
      realtime.cleanup();
    }
  }
});

test("unknown senders keep generic alerts and open conversations suppress their toasts", async () => {
  const missing = setupRealtime({ sender: async () => null });
  try {
    await missing.receive(dm);
    await missing.receive(group);
    expect(missing.toasts.map((toast) => toast.title)).toEqual([
      "New message",
      "New group message",
    ]);
  } finally {
    missing.cleanup();
  }
  for (const [path, payload] of [
    ["/messages/sender", dm],
    ["/messages/group/group", group],
  ] as const) {
    const viewing = setupRealtime({ path });
    try {
      expect(viewing.dismissed).toEqual([path]);
      await viewing.receive(payload);
      expect(viewing.toasts).toEqual([]);
      expect(viewing.desktop).toEqual([]);
    } finally {
      viewing.cleanup();
    }
  }
});

test("a slow sender lookup does not delay delivery or notify after sign-out", async () => {
  let finish!: (name: string) => void;
  const realtime = setupRealtime({
    sender: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = realtime.receive(dm);
  expect(
    realtime.events.some((event) => event.type === "realtimeMessage"),
  ).toBe(true);
  realtime.cleanup();
  finish("Sencha");
  await pending;
  expect(realtime.toasts).toEqual([]);
  expect(realtime.desktop).toEqual([]);
});

test("desktop notifications respect app connections and discard stale app-status checks", async () => {
  const connected = setupRealtime({
    active: false,
    appConnected: async () => true,
  });
  try {
    await connected.receive(dm);
    expect(connected.desktop).toEqual([]);
  } finally {
    connected.cleanup();
  }
  let finish!: (connected: boolean) => void;
  const stale = setupRealtime({
    active: false,
    appConnected: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  await stale.receive(dm);
  stale.cleanup();
  finish(false);
  await Promise.resolve();
  expect(stale.desktop).toEqual([]);
});

test("returning to a conversation dismisses its desktop alerts, while other pages retain them", async () => {
  for (const path of ["/messages/sender", "/messages/group/group", "/values"]) {
    const options = { active: false, path };
    const realtime = setupRealtime(options);
    try {
      await realtime.receive(path.includes("/group/") ? group : dm);
      expect(realtime.desktop).toHaveLength(1);
      options.active = true;
      realtime.emit("focus");
      expect(realtime.dismissed).toEqual(path === "/values" ? [] : [path]);
      expect(realtime.toasts).toEqual([]);
    } finally {
      realtime.cleanup();
    }
    expect(realtime.dismissed.at(-1)).toBeUndefined();
  }
});

test("reading a conversation prevents slow sender lookups from recreating its alerts", async () => {
  for (const [payload, event, detail, path] of [
    [dm, "sendRealtimeMarkRead", { sender_id: "sender" }, "/messages/sender"],
    [
      group,
      "sendRealtimeGroupMarkRead",
      { group_id: "group" },
      "/messages/group/group",
    ],
  ] as const) {
    let finish!: (name: string) => void;
    const options = {
      active: false,
      sender: () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    };
    const realtime = setupRealtime(options);
    try {
      const pending = realtime.receive(payload);
      realtime.emit(event, detail);
      expect(realtime.dismissed).toEqual([]);
      options.active = true;
      realtime.emit(event, detail);
      expect(realtime.dismissed).toEqual([path]);
      options.active = false;
      finish("Sencha");
      await pending;
      expect(realtime.desktop).toEqual([]);
      expect(realtime.toasts).toEqual([]);
    } finally {
      realtime.cleanup();
    }
  }
});

test("a pending app-status check cannot recreate a read message alert", async () => {
  let finish!: (connected: boolean) => void;
  const options = {
    active: false,
    appConnected: () =>
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
  };
  const realtime = setupRealtime(options);
  try {
    await realtime.receive(dm);
    options.active = true;
    realtime.emit("sendRealtimeMarkRead", { sender_id: "sender" });
    options.active = false;
    finish(false);
    await Promise.resolve();
    expect(realtime.desktop).toEqual([]);
  } finally {
    realtime.cleanup();
  }
});
