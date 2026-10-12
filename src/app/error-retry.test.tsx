import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

interface Node {
  type: unknown;
  props: { children?: unknown; onClick?: () => void; href?: string };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

const paths = readdirSync(new URL("./", import.meta.url), { recursive: true })
  .filter((path): path is string => typeof path === "string")
  .filter((path) => path === "error.tsx" || path.endsWith("/error.tsx"));

for (const path of paths) {
  test(`${path} retries through Next.js without a separate refresh or reset`, () => {
    const calls: string[] = [];
    const reports: unknown[][] = [];
    const exports = {} as { default: (props: unknown) => Node };
    const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      }).outputText,
      {
        exports,
        process: { env: { NODE_ENV: "production" } },
        require: (name: string) => {
          if (name === "react")
            return { useEffect: (effect: () => void) => effect() };
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "next/navigation") {
            return {
              useRouter: () => ({ refresh: () => calls.push("refresh") }),
            };
          }
          if (name === "next/link") return { default: "Link" };
          if (name === "@/components/ui/button") return { Button: "Button" };
          if (name === "@/components/ui/IconWrapper") return { Icon: "Icon" };
          if (name === "@/components/ui/NotFoundIllustration") {
            return { default: "Illustration" };
          }
          if (name === "@/components/Layout/Breadcrumb") {
            return { default: "Breadcrumb" };
          }
          if (name === "@/utils/analytics/rybbit") {
            return { trackEvent: () => {} };
          }
          if (name === "@/utils/analytics/reportAppError") {
            return {
              reportAppError: (...args: unknown[]) => {
                reports.push(args);
                return () => {};
              },
            };
          }
          if (name === "@/services/logger") {
            return { createLogger: () => ({ error: () => {} }) };
          }
          throw new Error(`Unexpected import: ${name}`);
        },
      },
    );
    const error = new Error("Temporary API failure");
    const tree = nodes(
      exports.default({
        error,
        retry: () => calls.push("retry"),
        reset: () => calls.push("reset"),
      }),
    );
    expect(reports).toEqual([[error, path.slice(0, -"/error.tsx".length)]]);
    const retryButton = tree.find(
      (node) =>
        (node.type === "Button" || node.type === "button") &&
        node.props.onClick,
    );
    expect(retryButton?.props.onClick).toBeFunction();
    retryButton?.props.onClick?.();
    expect(calls).toEqual(["retry"]);
    if (path.startsWith("inventories/")) {
      expect(tree.find((node) => node.type === "Link")?.props.href).toBe(
        path === "inventories/error.tsx" ? "/" : "/inventories",
      );
    }
  });
}
