import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = {
  type: unknown;
  props: { children?: unknown; [key: string]: unknown };
};
const source = transpileModule(
  readFileSync(new URL("./SuggestionForm.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
  },
).outputText;

function render(field: string, item: Record<string, unknown> | null) {
  const exports = {} as { SuggestionForm: (props: unknown) => Element };
  const effects: Array<{ effect: () => unknown; dependencies: unknown[] }> = [];
  const changes: Array<{ index: number; value: unknown }> = [];
  let stateIndex = 0;
  const jsx = (type: unknown, props: Element["props"]) => ({ type, props });
  runInNewContext(source, {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react")
        return {
          useState: (initial: unknown) => {
            const index = stateIndex++;
            const value =
              index === 2
                ? item
                : index === 3
                  ? field
                  : typeof initial === "function"
                    ? initial()
                    : initial;
            return [value, (value: unknown) => changes.push({ index, value })];
          },
          useRef: () => ({ current: null }),
          useEffect: (effect: () => unknown, dependencies: unknown[]) =>
            effects.push({ effect, dependencies }),
        };
      if (name === "@/hooks/useItemCatalogPage")
        return { useItemCatalogPage: () => ({ data: { items: [] } }) };
      if (name === "@/components/Items/Suggestions/CommonTrades")
        return {
          createEmptyCommonTrade: () => ({ requesting: [], offering: [] }),
        };
      if (name === "@/utils/items/categoryIcons")
        return { getCategoryColor: () => "#fff", getCategoryIcon: () => null };
      return new Proxy(
        {},
        {
          get: (_target, key) =>
            key === "default" ? name : (value: unknown) => value,
        },
      );
    },
  });
  const tree = exports.SuggestionForm({
    limits: {
      valid_fields: ["demand", "duped_demand", "trend"],
      valid_demands: ["Low", "Average", "High"],
      valid_trends: ["Dropping", "Stable", "Rising"],
    },
    loadingLimits: false,
    isVtEligible: false,
    user: null,
    onSubmit: async () => {},
    onCancel: () => {},
    onOpenGuidelines: () => {},
  });
  return { tree, effects, changes };
}

function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Element;
  return [node, ...nodes(node.props?.children)];
}
const item = {
  id: 1,
  name: "Torpedo",
  type: "Vehicle",
  demand: " average ",
  duped_demand: "LOW",
  trend: "stable",
};

test("categorical suggestions exclude the item's current value from backend options", () => {
  for (const [field, expected] of [
    ["demand", ["Low", "High"]],
    ["duped_demand", ["Average", "High"]],
    ["trend", ["Dropping", "Rising"]],
  ] as const) {
    const options = nodes(render(field, item).tree)
      .filter(
        (node) =>
          node.type === "button" &&
          ["Low", "Average", "High", "Dropping", "Stable", "Rising"].includes(
            node.props.children as string,
          ),
      )
      .map((node) => node.props.children);
    expect(options).toEqual([...expected]);
  }
});

test("unknown current values preserve backend options and selecting an item clears a stale suggestion", () => {
  const result = render("demand", { ...item, demand: null });
  const options = nodes(result.tree).filter(
    (node) =>
      node.type === "button" &&
      ["Low", "Average", "High"].includes(node.props.children as string),
  );
  expect(options).toHaveLength(3);
  result.effects
    .find(
      ({ dependencies }) =>
        dependencies.length === 1 && dependencies[0] === item.id,
    )
    ?.effect();
  expect(result.changes).toContainEqual({ index: 4, value: "" });
  expect(result.changes).toContainEqual({ index: 5, value: null });
});
