import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

// Run effects with isolated browser/auth mocks without replacing React globally.
function mount(filename: string) {
  const auth = { isLoading: true, user: { premiumtype: 0 } };
  const browser: Record<string, unknown> = {};
  const events = new Map<string, () => void>();
  const calls: string[] = [];
  let pathname = "/";
  let viewport = "small";
  let props: Record<string, unknown> = { adId: "grid-test" };
  let cursor = 0;
  const hooks: { current?: unknown; deps?: unknown[]; cleanup?: () => void }[] =
    [];
  let pending: (() => void)[] = [];
  let intersect = () => {};
  const exports: { default?: (props: Record<string, unknown>) => void } = {};
  const imports: Record<string, unknown> = {
    react: {
      useRef: (current: unknown) => (hooks[cursor++] ??= { current }),
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => {
        const previous = hooks[cursor];
        const index = cursor++;
        if (
          !previous?.deps ||
          deps.some((dep, i) => dep !== previous.deps?.[i])
        ) {
          pending.push(() => {
            previous?.cleanup?.();
            hooks[index] = { deps, cleanup: effect() || undefined };
          });
        }
      },
    },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
    "next/navigation": { usePathname: () => pathname },
    "@/hooks/useMediaQuery": {
      useMediaQuery: (query: string) =>
        query.includes("max-width")
          ? viewport === "small"
          : viewport === "wide",
    },
    "@/contexts/AuthContext": { useAuthContext: () => auth },
    "@/utils/auth/supporterAccess": {
      canHideAdsForPremiumType: (tier: number) => tier >= 2,
    },
    "@/services/logger": { createLogger: () => ({ warn: () => {} }) },
    "@/utils/analytics/nitroAds": {
      refreshAllAds: () => calls.push("refresh"),
      registerAdInstance: () => calls.push("register"),
      removeAdReference: () => calls.push("remove"),
    },
  };
  const code = transpileModule(
    readFileSync(new URL(filename, import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS, jsx: 4 } },
  ).outputText;
  runInNewContext(code, {
    Promise,
    exports,
    require: (id: string) => imports[id],
    window: browser,
    document: {
      getElementById: () => null,
      body: {},
      addEventListener: (name: string, callback: () => void) =>
        events.set(name, callback),
      removeEventListener: (name: string) => events.delete(name),
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    IntersectionObserver: class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersect = () => callback([{ isIntersecting: true }]);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        calls.push("disconnect");
      }
    },
  });
  return {
    auth,
    browser,
    calls,
    intersect: () => intersect(),
    resize: (size: string) => {
      viewport = size;
    },
    unmount: () => {
      for (const hook of hooks) hook.cleanup?.();
    },
    createdFlags: () =>
      hooks
        .filter((hook) => typeof hook.current === "boolean")
        .map((hook) => hook.current),
    navigate: (path: string) => {
      pathname = path;
    },
    render: (nextProps?: Record<string, unknown>) => {
      if (nextProps) props = nextProps;
      cursor = 0;
      pending = [];
      exports.default?.(props);
      for (const hook of hooks) {
        if (hook && "current" in hook && hook.current === null) {
          hook.current = { replaceChildren() {} };
        }
      }
      for (const effect of pending) effect();
    },
  };
}

test("robberies video initializes when auth finishes, without resetting on rerenders", () => {
  const app = mount("./NitroRobberiesTopAd.tsx");
  app.browser.nitroAds = {
    createAd: () => {
      app.calls.push("create");
      return Promise.resolve({});
    },
  };
  app.render();
  expect(app.calls).toEqual([]);
  app.auth.isLoading = false;
  app.render();
  app.render();
  expect(app.calls).toEqual(["create"]);
});

test("navigation refreshes once per route after auth resolves", () => {
  const app = mount("./NitroAdNavigation.tsx");
  app.render();
  app.navigate("/bounties");
  app.render();
  expect(app.calls).toEqual([]);
  app.auth.isLoading = false;
  app.render();
  app.render();
  expect(app.calls).toEqual(["refresh"]);
  app.auth.user.premiumtype = 2;
  app.navigate("/values");
  app.render();
  expect(app.calls).toEqual(["refresh"]);
});

test("anchor keeps its navigation registration through auth rechecks", async () => {
  const app = mount("./NitroBottomAnchor.tsx");
  app.auth.isLoading = false;
  app.browser.nitroAds = {
    createAd: () => Promise.resolve({ onNavigate() {} }),
  };
  app.render();
  await Promise.resolve();
  expect(app.calls).toEqual(["register"]);
  app.auth.isLoading = true;
  app.render();
  app.auth.isLoading = false;
  app.render();
  expect(app.calls).toEqual(["register"]);
  app.navigate("/messages");
  app.render();
  expect(app.calls).toEqual(["register", "remove"]);
});

test("grid stays observable until creation succeeds, allowing a failed call to retry", async () => {
  const app = mount("./NitroGridAd.tsx");
  app.auth.isLoading = false;
  app.render();
  app.intersect();
  expect(app.calls).toEqual([]);
  let fail = true;
  app.browser.nitroAds = {
    createAd: () => {
      app.calls.push("create");
      if (fail) throw new Error("temporarily unavailable");
      return Promise.resolve({});
    },
  };
  app.intersect();
  expect(app.calls).toEqual(["create"]);
  fail = false;
  app.intersect();
  await Promise.resolve();
  expect(app.calls).toEqual(["create", "create", "disconnect"]);
});

test("late floating-player creation does not register after entering a video-nc page", async () => {
  const app = mount("./NitroVideoPlayer.tsx");
  app.auth.isLoading = false;
  let resolveAd!: (ad: { onNavigate: () => void }) => void;
  app.browser.nitroAds = {
    createAd: () =>
      new Promise((resolve) => {
        resolveAd = resolve;
      }),
  };
  app.render();
  app.navigate("/items/changelogs/123");
  app.render();
  resolveAd({ onNavigate() {} });
  await Promise.resolve();
  expect(app.calls).toEqual(["remove"]);
});

for (const size of ["small", "wide"]) {
  test(`late ${size} rail creation cannot register after unmount`, async () => {
    const app = mount("./NitroLeftGutterAd.tsx");
    app.resize(size);
    let resolveAd!: (ad: { onNavigate: () => void }) => void;
    app.browser.nitroAds = {
      createAd: () =>
        new Promise((resolve) => {
          resolveAd = resolve;
        }),
    };
    app.render({ adIdSmall: "rail-small", adIdWide: "rail-wide" });
    app.unmount();
    resolveAd({ onNavigate() {} });
    await Promise.resolve();
    expect(app.calls).not.toContain("register");
    expect(app.createdFlags()).toEqual([false, false]);
  });

  test(`late ${size} rail failure cannot reset a replacement placement`, async () => {
    const app = mount("./NitroLeftGutterAd.tsx");
    app.resize(size);
    let rejectAd!: (error: Error) => void;
    app.browser.nitroAds = {
      createAd: () =>
        new Promise((_, reject) => {
          rejectAd = reject;
        }),
    };
    app.render({ adIdSmall: "rail-small", adIdWide: "rail-wide" });
    app.browser.nitroAds = {
      createAd: () => Promise.resolve({ onNavigate() {} }),
    };
    app.render({ adIdSmall: "new-small", adIdWide: "new-wide" });
    await Promise.resolve();
    const expectedFlags = size === "small" ? [true, false] : [false, true];
    expect(app.createdFlags()).toEqual(expectedFlags);
    rejectAd(new Error("old request failed"));
    await Promise.resolve();
    await Promise.resolve();
    expect(app.createdFlags()).toEqual(expectedFlags);
  });
}
