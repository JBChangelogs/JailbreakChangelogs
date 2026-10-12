import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

function setup() {
  const document = new EventTarget();
  const window = {
    location: {
      origin: "https://jailbreakchangelogs.com",
      pathname: "/values",
    },
    rybbit: undefined as
      | Pick<NonNullable<Window["rybbit"]>, "error">
      | undefined,
  };
  const exports = {} as typeof import("./reportAppError");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./reportAppError.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    { exports, window, document },
  );
  return { report: exports.reportAppError, window, document };
}

test("reports the original error with route and boundary context once, even after remount", () => {
  const { report, window, document } = setup();
  const calls: unknown[][] = [];
  window.rybbit = {
    error: (...args: unknown[]) => calls.push(args),
  };
  const error = Object.assign(new Error("render failed"), {
    digest: "server-reference",
  });
  const cleanup = report(error, "global");
  document.dispatchEvent(new Event("load"));
  cleanup();
  report(error, "global")();
  expect(calls).toEqual([
    [
      error,
      {
        source: "next-error-boundary",
        boundary: "global",
        pathname: "/values",
        digest: "server-reference",
        filename: "https://jailbreakchangelogs.com/values",
      },
    ],
  ]);
});

test("waits for analytics to load and stops listening when the boundary unmounts", () => {
  const { report, window, document } = setup();
  const calls: Error[] = [];
  const cleanup = report(new Error("pending"), "values");
  window.rybbit = {
    error: (error: Error) => calls.push(error),
  };
  document.dispatchEvent(new Event("load"));
  expect(calls).toHaveLength(1);
  cleanup();
  window.rybbit = undefined;
  const stop = report(new Error("unmounted"), "values");
  stop();
  window.rybbit = {
    error: (error: Error) => calls.push(error),
  };
  document.dispatchEvent(new Event("load"));
  expect(calls).toHaveLength(1);
});

test("an analytics exception cannot break the error screen", () => {
  const { report, window } = setup();
  window.rybbit = {
    error: () => {
      throw new Error("analytics failed");
    },
  };
  expect(() => report(new Error("page failed"), "global")()).not.toThrow();
});

test("global fallback reports the crash and recovers without app providers", () => {
  const reports: unknown[][] = [];
  const actions: string[] = [];
  const effects: (() => unknown)[] = [];
  type Node = {
    type: unknown;
    props: { children?: unknown; onClick?: () => void };
  };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const exports = {} as { default: (props: { error: Error }) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("../../app/global-error.tsx", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS, jsx: 4 } },
    ).outputText,
    {
      exports,
      process: { env: { NODE_ENV: "production" } },
      window: {
        history: { length: 2, back: () => actions.push("back") },
        location: { reload: () => actions.push("reload") },
      },
      require: (name: string) => {
        if (name === "react")
          return { useEffect: (effect: () => unknown) => effects.push(effect) };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "next/script") return { default: "Script" };
        if (name === "@/utils/analytics/reportAppError")
          return { reportAppError: (...args: unknown[]) => reports.push(args) };
        throw new Error(`Unexpected dependency in global fallback: ${name}`);
      },
    },
  );
  const error = new Error("Root layout failed");
  const tree = exports.default({ error });
  effects.forEach((effect) => effect());
  expect(reports).toEqual([[error, "global"]]);
  const flatten = (value: unknown): Node[] => {
    if (Array.isArray(value)) return value.flatMap(flatten);
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as Node;
    return [node, ...flatten(node.props.children)];
  };
  const nodes = flatten(tree);
  expect(nodes.some((node) => node.type === "html")).toBe(true);
  expect(nodes.some((node) => node.type === "body")).toBe(true);
  expect(nodes.some((node) => node.type === "Script")).toBe(true);
  nodes
    .filter((node) => node.type === "button")
    .forEach((node) => node.props.onClick?.());
  expect(actions).toEqual(["reload", "back"]);
});
