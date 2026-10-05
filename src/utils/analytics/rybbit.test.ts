import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("layout usage waits for analytics, excludes smaller screens, deduplicates and cleans up", () => {
  const browser = new EventTarget();
  const document = new EventTarget();
  const largeScreen = Object.assign(new EventTarget(), { matches: false });
  const window = {
    matchMedia: (query: string) => {
      expect(query).toBe("(min-width: 1536px)");
      return largeScreen;
    },
    rybbit: undefined as { event: (name: string) => void } | undefined,
  };
  let layout = "sidebar";
  const events: string[] = [];
  const exports = {} as typeof import("./rybbit");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./rybbit.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      window,
      document,
      require: () => ({
        getDesktopNavigation: () => layout,
        subscribeDesktopNavigation: (callback: () => void) => {
          browser.addEventListener("desktopNavigationChanged", callback);
          return () =>
            browser.removeEventListener("desktopNavigationChanged", callback);
        },
      }),
    },
  );

  const cleanup = exports.trackDesktopNavigationUsage();
  largeScreen.matches = true;
  largeScreen.dispatchEvent(new Event("change"));
  expect(events).toEqual([]);
  window.rybbit = { event: (name) => events.push(name) };
  document.dispatchEvent(new Event("load"));
  document.dispatchEvent(new Event("load"));
  expect(events).toEqual(["Sidebar Navigation Used"]);

  largeScreen.matches = false;
  layout = "top-bar";
  browser.dispatchEvent(new Event("desktopNavigationChanged"));
  expect(events).toHaveLength(1);
  largeScreen.matches = true;
  largeScreen.dispatchEvent(new Event("change"));
  layout = "sidebar";
  browser.dispatchEvent(new Event("desktopNavigationChanged"));
  expect(events).toEqual([
    "Sidebar Navigation Used",
    "Top Bar Navigation Used",
  ]);

  const count = events.length;
  cleanup();
  const stop = exports.trackDesktopNavigationUsage();
  expect(events).toHaveLength(count + 1);
  stop();
  layout = "top-bar";
  browser.dispatchEvent(new Event("desktopNavigationChanged"));
  largeScreen.dispatchEvent(new Event("change"));
  document.dispatchEvent(new Event("load"));
  expect(events).toHaveLength(count + 1);
});
