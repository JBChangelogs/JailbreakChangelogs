import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { isNotificationPageActive } from "./desktopNotifications";

test("notification toasts require a visible, focused page, including after returning", () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  let visibilityState = "visible";
  let focused = true;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get visibilityState() {
        return visibilityState;
      },
      hasFocus: () => focused,
    },
  });

  try {
    expect(isNotificationPageActive()).toBe(true);
    visibilityState = "hidden";
    expect(isNotificationPageActive()).toBe(false);
    focused = false;
    expect(isNotificationPageActive()).toBe(false);
    visibilityState = "visible";
    expect(isNotificationPageActive()).toBe(false);
    focused = true;
    expect(isNotificationPageActive()).toBe(true);
    Reflect.deleteProperty(globalThis, "document");
    expect(isNotificationPageActive()).toBe(false);
  } finally {
    if (originalDocument) {
      Object.defineProperty(globalThis, "document", originalDocument);
    } else {
      Reflect.deleteProperty(globalThis, "document");
    }
  }
});

test("message alerts close by conversation, clean up on clicks, and clear on sign-out", () => {
  const notifications: FakeNotification[] = [];
  const destinations: string[] = [];
  class FakeNotification {
    static permission = "granted";
    closes = 0;
    onclose?: () => void;
    onclick?: (event: { preventDefault: () => void }) => void;
    constructor() {
      notifications.push(this);
    }
    close() {
      this.closes++;
      this.onclose?.();
    }
  }
  const exports = {} as typeof import("./desktopNotifications");
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./desktopNotifications.ts", import.meta.url),
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
      Notification: FakeNotification,
      document: { visibilityState: "hidden" },
      window: {
        location: { assign: (path: string) => destinations.push(path) },
      },
      require: () => ({ safeGetJSON: () => true }),
    },
  );
  for (const [tag, path] of [
    ["realtime-dm:1", "/messages/alice"],
    ["realtime-dm:2", "/messages/alice"],
    ["realtime-dm:3", "/messages/bob"],
    ["realtime-group:4", "/messages/group/chat"],
    ["general:5", "/messages/alice"],
  ]) {
    exports.showDesktopNotification({
      title: "Message",
      tag,
      target: { internalPath: path },
    });
  }
  exports.dismissMessageDesktopNotifications("/values");
  expect(notifications.map((notification) => notification.closes)).toEqual([
    0, 0, 0, 0, 0,
  ]);
  exports.dismissMessageDesktopNotifications(
    "/messages/alice/?from=toast#message",
  );
  expect(notifications.map((notification) => notification.closes)).toEqual([
    1, 1, 0, 0, 0,
  ]);
  notifications[2].onclick?.({ preventDefault() {} });
  expect(destinations).toEqual(["/messages/bob"]);
  exports.dismissMessageDesktopNotifications("/messages/group/chat");
  exports.dismissMessageDesktopNotifications();
  expect(notifications.map((notification) => notification.closes)).toEqual([
    1, 1, 1, 1, 0,
  ]);
  exports.showDesktopNotification({
    title: "Unread",
    tag: "realtime-dm:6",
    target: { internalPath: "/messages/bob" },
  });
  exports.dismissMessageDesktopNotifications();
  expect(notifications[5].closes).toBe(1);
  for (const id of [7, 8])
    exports.showDesktopNotification({
      title: "Unread",
      tag: `realtime-dm:${id}`,
      target: { internalPath: "/messages/bob" },
    });
  notifications[6].onclick?.({ preventDefault() {} });
  expect(
    notifications.slice(6).map((notification) => notification.closes),
  ).toEqual([1, 1]);
});
