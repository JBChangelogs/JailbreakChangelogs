import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

interface Node {
  type: string;
  props: { children?: unknown; onClick?: () => void };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

const source = transpileModule(
  readFileSync(new URL("./global-error.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
).outputText;

for (const environment of ["production", "development"]) {
  test(`global error protects details and preserves recovery in ${environment}`, () => {
    const calls: string[] = [];
    const reports: unknown[][] = [];
    const exports = {} as { default: (props: unknown) => Node };
    const jsx = (type: string, props: Node["props"]) => ({ type, props });
    runInNewContext(source, {
      exports,
      process: { env: { NODE_ENV: environment } },
      window: {
        location: {
          reload: () => calls.push("reload"),
        },
      },
      require: (name: string) => {
        if (name === "react")
          return { useEffect: (effect: () => void) => effect() };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "next/script") return { default: "Script" };
        if (name === "@/utils/analytics/reportAppError")
          return { reportAppError: (...args: unknown[]) => reports.push(args) };
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    const error = Object.assign(new Error("Private server failure"), {
      digest: "123456",
    });
    const tree = exports.default({ error });
    const elements = nodes(tree);
    expect(reports).toEqual([[error, "global"]]);
    expect(elements.some((node) => node.type === "html")).toBe(true);
    expect(elements.some((node) => node.type === "body")).toBe(true);
    expect(JSON.stringify(tree)).toContain("123456");
    expect(JSON.stringify(tree).includes(error.message)).toBe(
      environment === "development",
    );
    expect(elements.some((node) => node.type === "details")).toBe(
      environment === "development",
    );
    const buttons = elements.filter((node) => node.type === "button");
    expect(buttons).toHaveLength(1);
    buttons[0].props.onClick?.();
    expect(calls).toEqual(["reload"]);
  });
}

function recoveryHarness() {
  const storage = new Map<string, string>();
  const reloads: string[] = [];
  const requests: { url: string; options: RequestInit }[] = [];
  const cleanups: (() => void)[] = [];
  let abortTimeout = () => {};
  const state = {
    body: { date: 2000 } as unknown,
    ok: true,
    failure: "",
    environment: "production",
    buildTime: "1000",
  };

  const mount = async (cancel?: "timeout" | "unmount") => {
    const exports = {} as { default: (props: unknown) => Node };
    const jsx = (type: string, props: Node["props"]) => ({ type, props });
    runInNewContext(source, {
      exports,
      AbortController,
      process: {
        env: {
          NODE_ENV: state.environment,
          NEXT_PUBLIC_BUILD_TIME: state.buildTime,
        },
      },
      fetch: async (url: string, options: RequestInit) => {
        requests.push({ url, options });
        if (state.failure === "network") throw new Error("Offline");
        return {
          ok: state.ok,
          json: async () => {
            if (state.failure === "json") throw new Error("Invalid JSON");
            return state.body;
          },
        };
      },
      window: {
        setTimeout: (callback: () => void) => {
          abortTimeout = callback;
          return 1;
        },
        clearTimeout: () => {},
        location: { reload: () => reloads.push("reload") },
        sessionStorage: {
          getItem: (key: string) => {
            if (state.failure === "read") throw new Error("Storage blocked");
            return storage.get(key) ?? null;
          },
          setItem: (key: string, value: string) => {
            if (state.failure === "write") throw new Error("Storage blocked");
            storage.set(key, value);
          },
        },
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useEffect: (effect: () => void | (() => void)) => {
              const cleanup = effect();
              if (cleanup) cleanups.push(cleanup);
            },
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "next/script") return { default: "Script" };
        if (name === "@/utils/analytics/reportAppError")
          return { reportAppError: () => {} };
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    const tree = exports.default({ error: new Error("Render failed") });
    if (cancel === "timeout") abortTimeout();
    if (cancel === "unmount") cleanups.at(-1)?.();
    await new Promise<void>((resolve) => setImmediate(resolve));
    return tree;
  };
  return { mount, state, storage, reloads, requests };
}

test("a newer build reloads once per tab, even if the old page fails again", async () => {
  const harness = recoveryHarness();
  await harness.mount();
  expect(harness.reloads).toEqual(["reload"]);
  expect(harness.storage.get("global-error-reload-build")).toBe("2000");
  expect(harness.requests[0].url).toBe("/api/version");
  expect(harness.requests[0].options.cache).toBe("no-store");

  await harness.mount();
  expect(harness.reloads).toHaveLength(1);
  harness.state.body = { date: 1500 };
  await harness.mount();
  expect(harness.reloads).toHaveLength(1);
  harness.state.body = { date: 3000 };
  await harness.mount();
  expect(harness.reloads).toHaveLength(2);
});

test("current, older, and invalid versions leave the normal error screen visible", async () => {
  for (const body of [
    { date: 1000 },
    { date: 500 },
    { date: "2000" },
    { date: Infinity },
    {},
    null,
  ]) {
    const harness = recoveryHarness();
    harness.state.body = body;
    const tree = await harness.mount();
    expect(harness.reloads).toEqual([]);
    expect(nodes(tree).some((node) => node.type === "button")).toBe(true);
    expect(harness.storage.size).toBe(0);
  }
});

test("failed checks, blocked storage, timeouts, and unmounts never reload", async () => {
  for (const failure of ["network", "json", "read", "write"]) {
    const harness = recoveryHarness();
    harness.state.failure = failure;
    await harness.mount();
    expect(harness.reloads).toEqual([]);
  }
  const failedResponse = recoveryHarness();
  failedResponse.state.ok = false;
  await failedResponse.mount();
  expect(failedResponse.reloads).toEqual([]);

  for (const cancel of ["timeout", "unmount"] as const) {
    const harness = recoveryHarness();
    await harness.mount(cancel);
    expect(harness.requests[0].options.signal?.aborted).toBe(true);
    expect(harness.reloads).toEqual([]);
    expect(harness.storage.size).toBe(0);
  }
});

test("development and missing build metadata skip automatic recovery", async () => {
  const local = recoveryHarness();
  local.state.environment = "development";
  await local.mount();
  expect(local.requests).toEqual([]);
  for (const buildTime of ["", "unknown", "0", "Infinity"]) {
    const harness = recoveryHarness();
    harness.state.buildTime = buildTime;
    await harness.mount();
    expect(harness.requests).toEqual([]);
  }
});
