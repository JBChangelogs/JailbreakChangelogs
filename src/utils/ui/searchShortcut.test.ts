import { expect, test } from "bun:test";
import { isItemSearchShortcut } from "./searchShortcut";

const key = (overrides: Partial<KeyboardEvent> = {}) =>
  ({
    key: "/",
    defaultPrevented: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    target: null,
    ...overrides,
  }) as KeyboardEvent;

test("slash focuses search without overriding browser shortcuts or typing", () => {
  expect(isItemSearchShortcut(key())).toBe(true);
  for (const overrides of [
    { key: "f", ctrlKey: true },
    { key: "f", metaKey: true },
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
    { defaultPrevented: true },
  ])
    expect(isItemSearchShortcut(key(overrides))).toBe(false);
  expect(
    isItemSearchShortcut(
      key({ target: { isContentEditable: true } as unknown as EventTarget }),
    ),
  ).toBe(false);
  expect(
    isItemSearchShortcut(
      key({ target: { closest: () => ({}) } as unknown as EventTarget }),
    ),
  ).toBe(false);
});
