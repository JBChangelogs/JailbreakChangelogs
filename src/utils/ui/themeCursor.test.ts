import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { themeInitScript, type ThemeOption } from "./themeOptions";

const options = (
  [
    ["halloween", "dark"],
    ["dark", "dark"],
    ["catppuccin-latte", "light"],
  ] as const
).map(([value, scheme]) => ({ value, scheme }) as ThemeOption);
const initScript = themeInitScript(options, "halloween");

test("cursor preference restores before hydration without changing the saved theme", () => {
  for (const theme of [
    "halloween",
    "dark",
    "catppuccin-latte",
    "removed",
    null,
  ]) {
    for (const saved of [null, "true", "false", "invalid"]) {
      const classes = new Set<string>();
      const dataset: Record<string, string> = {};
      runInNewContext(initScript, {
        localStorage: {
          getItem: (key: string) => (key === "theme" ? theme : saved),
        },
        document: {
          documentElement: {
            dataset,
            classList: { add: (name: string) => classes.add(name) },
          },
        },
      });
      expect(dataset.themeCursor).toBe(saved === "true" ? "on" : "off");
      const applied =
        theme === "removed" || theme === null ? "halloween" : theme;
      expect(classes).toEqual(new Set([applied]));
      expect(dataset.scheme).toBe(
        applied === "catppuccin-latte" ? "light" : "dark",
      );
    }
  }
  expect(() =>
    runInNewContext(initScript, {
      localStorage: {
        getItem: () => {
          throw new Error("Storage unavailable");
        },
      },
      document: { documentElement: { dataset: {} } },
    }),
  ).not.toThrow();
});

test("cursor toggle applies immediately, saves locally and notifies subscribers", () => {
  const dataset: Record<string, string> = {};
  const events = new EventTarget();
  const writes: [string, string][] = [];
  const exports = {} as typeof import("./themeCursor");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./themeCursor.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      Event,
      document: { documentElement: { dataset } },
      window: events,
      require: () => ({
        safeLocalStorage: {
          setItem: (key: string, value: string) => {
            writes.push([key, value]);
            return false;
          },
        },
      }),
    },
  );
  expect(exports.getThemeCursorEnabled()).toBe(false);
  let notifications = 0;
  const unsubscribe = exports.subscribeThemeCursor(() => notifications++);
  exports.setThemeCursorEnabled(false);
  expect(exports.getThemeCursorEnabled()).toBe(false);
  expect(dataset.themeCursor).toBe("off");
  exports.setThemeCursorEnabled(true);
  expect(exports.getThemeCursorEnabled()).toBe(true);
  expect(writes).toEqual([
    ["theme-cursor-enabled", "false"],
    ["theme-cursor-enabled", "true"],
  ]);
  expect(notifications).toBe(2);
  unsubscribe();
  exports.setThemeCursorEnabled(false);
  expect(notifications).toBe(2);
});
