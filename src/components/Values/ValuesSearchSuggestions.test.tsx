import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { isValidElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { hasItemValue } from "@/utils/items/itemValue";
import type ValuesSearchSuggestions from "./ValuesSearchSuggestions";
import type { ValueSearchItem } from "./ValuesSearchSuggestions";

const exports = {} as {
  default: typeof ValuesSearchSuggestions;
  getItemSuggestions: (
    items: ValueSearchItem[],
    term: string,
  ) => ValueSearchItem[];
};
runInNewContext(
  transpileModule(
    readFileSync(
      new URL("./ValuesSearchSuggestions.tsx", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
  ).outputText,
  {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "@/utils/items/itemValue") return { hasItemValue };
      if (name === "@/utils/ui/images")
        return { getItemImagePath: () => "/item.webp" };
      if (name === "@/utils/items/categoryIcons")
        return {
          getCategoryColor: () => "#ffffff",
          getCategoryIcon: () => null,
        };
      return {};
    },
  },
);

type Props = { children?: ReactNode; onClick?: () => void };
function nodes(node: ReactNode): Props[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!isValidElement<Props>(node)) return [];
  return [node.props, ...nodes(node.props.children)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("");
  if (isValidElement<Props>(node)) return text(node.props.children);
  return typeof node === "string" ? node : "";
}

test("suggestions show clean and duped values, handle unknown values, and select the item", () => {
  for (const value of ["28m", null, "N/A", "", "null"]) {
    const item: ValueSearchItem = {
      id: 1,
      name: "Torpedo",
      type: "Vehicle",
      cash_value: value,
      duped_value: "25m",
    };
    const suggestions = exports.getItemSuggestions([item], "tor");
    let selected: ValueSearchItem | undefined;
    const tree = exports.default({
      suggestions,
      highlightedIndex: -1,
      onHighlight: () => {},
      onSelect: (next) => {
        selected = next;
      },
    });
    expect(text(tree)).toContain(`Clean: ${value === "28m" ? "28m" : "N/A"}`);
    expect(text(tree)).toContain("Duped: 25m");
    nodes(tree)
      .find((node) => node.onClick)
      ?.onClick?.();
    expect(selected).toBe(item);
  }
});
