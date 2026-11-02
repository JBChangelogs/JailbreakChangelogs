import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { Metric } from "./MetricHistoryChart";

const requireModule = createRequire(import.meta.url);

type Node = { props: Record<string, unknown> & { children?: unknown } };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("tooltips list the selected metric before its comparison without mutating the payload", () => {
  const exports = {} as { default: (props: unknown) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./MetricHistoryChart.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            useId: () => "chart",
            useState: (initial: unknown) => [initial, () => {}],
          };
        if (name.endsWith("useMediaQuery"))
          return { useMediaQuery: () => false };
        return requireModule(name);
      },
    },
  );
  const metrics: Metric[] = ["cash", "duped"].map((key, i) => ({
    key,
    label: key,
    color: "#ffffff",
    format: String,
    overlay: i === 0 ? "duped" : "cash",
    series: [{ t: 1793505600000, v: i + 1 }],
  }));
  for (const selected of ["cash", "duped"]) {
    const tree = exports.default({
      title: "History",
      metrics,
      defaultMetric: selected,
      ranges: [{ value: "all", label: "All time", short: "all", days: null }],
    });
    const tooltip = nodes(tree).find(
      (node) => typeof node.props.content === "function",
    )!;
    const content = tooltip.props.content as (props: unknown) => Node;
    const comparison = {
      dataKey: "o",
      name: selected === "cash" ? "duped" : "cash",
      value: 1,
    };
    const primary = { dataKey: "v", name: selected, value: 2 };
    for (const payload of [
      [comparison, primary],
      [primary, comparison],
      [primary],
    ]) {
      const original = [...payload];
      const result = content({ active: true, payload });
      expect(result.props.payload).toEqual(
        payload.length === 2 ? [primary, comparison] : [primary],
      );
      expect(payload).toEqual(original);
      expect(result.props.active).toBe(true);
    }
  }
});
