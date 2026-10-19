import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

function setup(online: boolean) {
  const effects: (() => void | (() => void))[] = [];
  const cleanups: (() => void | (() => void))[] = [];
  const listeners = new Map<string, Set<(event: Event) => void>>();
  const timers = new Map<number, { callback: () => void; delay: number }>();
  const navigations: string[] = [];
  const navigator = { onLine: online };
  let reachable = true;
  let timerId = 0;
  const events = {
    addEventListener(name: string, callback: (event: Event) => void) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(callback);
    },
    removeEventListener(name: string, callback: (event: Event) => void) {
      listeners.get(name)?.delete(callback);
    },
    dispatchEvent(event: Event) {
      listeners.get(event.type)?.forEach((callback) => callback(event));
    },
  };
  class Element {
    constructor(public href: string) {}
    closest() {
      return { href: this.href, target: "", hasAttribute: () => false };
    }
  }
  const imports: Record<string, unknown> = {
    react: {
      useEffect: (effect: () => void | (() => void)) => effects.push(effect),
      useRef: (current: unknown) => ({ current }),
      useState: (value: unknown) => [value, () => {}],
    },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
    "next/navigation": { usePathname: () => "/" },
    "nextjs-toploader": { useTopLoader: () => ({ done: () => {} }) },
  };
  function load(path: string) {
    const exports = {} as { default: () => unknown };
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      }).outputText,
      {
        exports,
        require: (name: string) => {
          if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
          return imports[name];
        },
        window: {
          ...events,
          location: {
            href: "https://example.com/",
            pathname: "/",
            search: "",
            assign: (url: string) => navigations.push(url),
          },
        },
        document: { ...events, visibilityState: "visible" },
        navigator,
        Element,
        Event,
        URL,
        AbortController,
        fetch: async () => ({ ok: reachable }),
        setTimeout: (callback: () => void, delay: number) => {
          timers.set(++timerId, { callback, delay });
          return timerId;
        },
        clearTimeout: (id: number) => timers.delete(id),
      },
    );
    return exports;
  }
  const detector = load("../OfflineDetector.tsx");
  imports["@/components/OfflineDetector"] = detector;
  load("./OfflineNavigationRecovery.tsx").default();
  detector.default();
  effects.forEach((effect) => {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  });

  return {
    navigations,
    navigator,
    emit: (name: string) => events.dispatchEvent(new Event(name)),
    setReachable: (value: boolean) => (reachable = value),
    initialCheck() {
      const entry = [...timers].find(([, timer]) => timer.delay === 100)!;
      timers.delete(entry[0]);
      entry[1].callback();
    },
    click(href = "https://example.com/values", metaKey = false) {
      const event = new Event("click", { cancelable: true });
      Object.defineProperties(event, {
        target: { value: new Element(href) },
        button: { value: 0 },
        metaKey: { value: metaKey },
      });
      events.dispatchEvent(event);
      return event.defaultPrevented;
    },
    cleanup: () => cleanups.forEach((cleanup) => cleanup()),
  };
}

async function settle() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

test("browser offline heuristics do not block links when the site is reachable", async () => {
  const state = setup(false);
  try {
    expect(state.click()).toBe(false);
    state.initialCheck();
    await settle();
    expect(state.click()).toBe(false);
    state.emit("offline");
    await settle();
    expect(state.click()).toBe(false);
    expect(state.navigations).toEqual(["https://example.com/values"]);
  } finally {
    state.cleanup();
  }
});

test("confirmed outages queue the latest internal link and recover despite the browser offline flag", async () => {
  const state = setup(false);
  try {
    state.setReachable(false);
    state.initialCheck();
    await settle();
    expect(state.click()).toBe(true);
    expect(state.click("https://example.com/trading")).toBe(true);
    expect(state.click("https://other.example.com/")).toBe(false);
    expect(state.click("https://example.com/")).toBe(false);
    expect(state.click("https://example.com/seasons", true)).toBe(false);
    expect(state.navigations).toEqual([]);

    state.setReachable(true);
    state.emit("visibilitychange");
    await settle();
    expect(state.navigator.onLine).toBe(false);
    expect(state.navigations).toEqual(["https://example.com/trading"]);
    expect(state.click()).toBe(false);
  } finally {
    state.cleanup();
  }
});
