import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

function setup(failInstall = false) {
  const document = new EventTarget();
  const window = {
    location: { pathname: "/robberies" },
    rybbit: undefined as { event: (...args: unknown[]) => void } | undefined,
  };
  let onEvent!: (message: string) => void;
  const warnings: unknown[] = [];
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./instrumentation-client.ts", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports: {},
      window,
      document,
      console: { warn: (...args: unknown[]) => warnings.push(args) },
      require: (name: string) => {
        expect(name).toBe("translation-resilience");
        return {
          installTranslationResilience(options: { onEvent: typeof onEvent }) {
            if (failInstall) throw new Error("installation failed");
            onEvent = options.onEvent;
          },
        };
      },
    },
  );
  return { window, document, onEvent, warnings };
}

for (const analyticsReady of [true, false]) {
  test(`translation detection reports once with analytics ${analyticsReady ? "ready" : "loading"}`, () => {
    const app = setup();
    const calls: unknown[][] = [];
    const analytics = { event: (...args: unknown[]) => calls.push(args) };
    if (analyticsReady) app.window.rybbit = analytics;
    app.onEvent("translation signal detected, observing document");
    app.onEvent("removeChild: displaced text already gone, removal skipped");
    expect(calls).toEqual([]);
    app.onEvent("translation activity detected");
    app.window.location.pathname = "/values/calculator";
    app.window.rybbit = analytics;
    app.document.dispatchEvent(new Event("load"));
    app.document.dispatchEvent(new Event("load"));
    expect(calls).toEqual([
      ["Page Translation Detected", { pathname: "/robberies" }],
    ]);
  });
}

test("analytics and installation failures do not escape instrumentation", () => {
  const app = setup();
  app.window.rybbit = {
    event() {
      throw new Error("analytics failed");
    },
  };
  expect(() => app.onEvent("translation activity detected")).not.toThrow();
  expect(setup(true).warnings).toHaveLength(1);
});
