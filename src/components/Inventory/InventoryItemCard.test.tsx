import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { hasItemValue } from "@/utils/items/itemValue";
import { formatFullValue } from "@/utils/trading/values";
import { getInventoryDupedValue } from "@/utils/trading/inventoryValues";

interface Node {
  type: unknown;
  props: Record<string, unknown>;
}

function mobileValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(mobileValues);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return node.type === "span" && node.props.className === "sm:hidden"
    ? [node.props.children]
    : mobileValues(node.props.children);
}

for (const path of ["./InventoryItemCard.tsx", "../OG/OGItemCard.tsx"]) {
  test(`${path} shows N/A for unavailable mobile values and preserves compact prices`, () => {
    const exports = {} as { default: (props: unknown) => Node };
    const noop = () => null;
    const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      }).outputText,
      {
        exports,
        require: (name: string) => {
          if (name === "react")
            return { useState: (value: unknown) => [value, noop] };
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "@/utils/items/itemValue") return { hasItemValue };
          if (name === "@/utils/trading/values") return { formatFullValue };
          if (name === "@/utils/trading/inventoryValues")
            return { getInventoryDupedValue };
          if (name === "@/app/fonts") return { bangers: { className: "" } };
          return new Proxy({}, { get: () => noop });
        },
      },
    );
    const render = (
      cash: string | null | undefined,
      duped = cash,
      isDupedItem = false,
    ) =>
      mobileValues(
        exports.default({
          item: {
            id: "owned",
            title: "Blue Fire",
            categoryTitle: "Drift",
            info: [],
            uniqueCirculation: 1,
            user_id: "123",
            logged_at: 0,
          },
          itemData: { cash_value: cash, duped_value: duped },
          userId: "123",
          isDupedItem,
          getUserAvatar: noop,
          getUsername: noop,
          getUserDisplay: noop,
        }),
      );
    for (const value of [null, undefined, "", " ", "null", "N/A", " N/A "])
      expect(render(value)).toEqual(["N/A", "N/A"]);
    expect(render("28m")).toEqual(["28m", "28m"]);
    expect(render("0")).toEqual(["0", "0"]);
    expect(render("28m", "")).toEqual(["28m", "N/A"]);
    if (path === "./InventoryItemCard.tsx") {
      expect(render("28m", "", true)).toEqual(["28m", "28m"]);
    }
  });
}
