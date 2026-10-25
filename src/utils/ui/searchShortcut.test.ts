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

test("global search uses Ctrl/Cmd K without taking slash or modified shortcuts", async () => {
  const { isGlobalSearchShortcut } = await import("./searchShortcut");
  expect(isGlobalSearchShortcut(key({ key: "k", ctrlKey: true }))).toBe(true);
  expect(isGlobalSearchShortcut(key({ key: "K", metaKey: true }))).toBe(true);
  for (const overrides of [
    { key: "k" },
    { key: "/", ctrlKey: true },
    { key: "k", ctrlKey: true, altKey: true },
    { key: "k", ctrlKey: true, shiftKey: true },
    { key: "k", ctrlKey: true, defaultPrevented: true },
    { key: "k", ctrlKey: true, isComposing: true },
  ])
    expect(isGlobalSearchShortcut(key(overrides))).toBe(false);
});
