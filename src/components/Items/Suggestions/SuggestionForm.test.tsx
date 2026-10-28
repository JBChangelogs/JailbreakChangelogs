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

function render(
  field: string,
  item: Record<string, unknown> | null,
  suggestedValue = "",
  isVtEligible = false,
) {
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
                  : index === 4
                    ? suggestedValue
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
    isVtEligible,
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
    const options = optionButtons(render(field, item).tree).map(optionLabel);
    expect(options).toEqual([...expected]);
  }
});

test("unknown current values preserve backend options and selecting an item clears a stale suggestion", () => {
  const result = render("demand", { ...item, demand: null });
  const options = optionButtons(result.tree);
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

function optionButtons(tree: unknown) {
  return nodes(tree).filter(
    (node) =>
      node.type === "button" && typeof node.props["aria-pressed"] === "boolean",
  );
}

function optionLabel(button: Element) {
  return nodes(button).find(
    (node) => node.type === "span" && typeof node.props.children === "string",
  )?.props.children;
}

test("demand and trend options preserve pressed state and selection", () => {
  for (const [field, selected] of [
    ["demand", "High"],
    ["duped_demand", "Average"],
    ["trend", "Rising"],
  ]) {
    const result = render(field, item, selected);
    const options = optionButtons(result.tree);
    const active = options.find((node) => optionLabel(node) === selected)!;
    expect(active.props["aria-pressed"]).toBe(true);
    expect(
      nodes(active).some((node) => node.props?.icon === "heroicons:check"),
    ).toBe(true);
    const inactive = options.find((node) => optionLabel(node) !== selected)!;
    expect(inactive.props["aria-pressed"]).toBe(false);
    expect(
      nodes(inactive).some((node) => node.props?.icon === "heroicons:check"),
    ).toBe(false);
    (inactive.props.onClick as () => void)();
    expect(result.changes).toContainEqual({
      index: 4,
      value: optionLabel(inactive),
    });
  }
});

test("visibility uses a segmented choice and preserves the VT submission flag", () => {
  const result = render("demand", item, "", true);
  const control = nodes(result.tree).find(
    (node) => node.props?.radio === true,
  )!;
  expect(control.props.value).toBe("vt");
  const list = nodes(control).find(
    (node) => node.props["data-variant"] === "filled",
  );
  expect(list).toBeDefined();
  expect(list?.props.hideIndicator).not.toBe(true);
  expect(
    nodes(control).some((node) => node.props.children === "Everyone"),
  ).toBe(true);
  expect(
    nodes(control).some((node) => node.props.children === "Value team only"),
  ).toBe(true);
  const change = control.props.onValueChange as (value: string) => void;
  change("public");
  expect(result.changes).toContainEqual({ index: 14, value: false });
  change("vt");
  expect(result.changes).toContainEqual({ index: 14, value: true });
  expect(
    nodes(render("demand", item).tree).some(
      (node) => node.props?.radio === true,
    ),
  ).toBe(false);
});
