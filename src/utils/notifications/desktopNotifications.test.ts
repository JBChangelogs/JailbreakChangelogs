import { expect, test } from "bun:test";
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
