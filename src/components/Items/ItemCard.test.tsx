import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { hasItemValue } from "@/utils/items/itemValue";
import { formatFullValue, getValueChange } from "@/utils/trading/values";

interface Node {
  type: unknown;
  props: Record<string, unknown>;
}

function badges(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(badges);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  const children = badges(node.props.children);
  return node.type === "span" &&
    String(node.props.className).includes("bg-button-info")
    ? [node.props.children, ...children]
    : children;
}

test("item cards show N/A for missing mobile values and preserve compact prices", () => {
  let mobile = true;
  let pathname = "/values";
  const exports = {} as {
    default: (props: unknown) => Node;
  };
  const noop = () => null;
  const react = {
    memo: (component: unknown) => component,
    useEffect: noop,
    useRef: (current: unknown) => ({ current }),
    useState: (initial: unknown) => [initial, noop],
  };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ItemCard.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react") return { ...react, default: react };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/utils/items/itemValue") return { hasItemValue };
        if (name === "@/utils/trading/values")
          return { formatFullValue, getValueChange };
        if (name === "@/hooks/useMediaQuery")
          return { useMediaQuery: () => mobile };
        if (name === "next/navigation") return { usePathname: () => pathname };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ isAuthenticated: false }) };
        return new Proxy({}, { get: () => noop });
      },
    },
  );
  const render = (value: string | null | undefined) =>
    badges(
      exports.default({
        item: {
          id: 1,
          name: "Blue Fire",
          type: "Drift",
          cash_value: value,
          duped_value: value,
        },
        isFavorited: false,
        onFavoriteChange: noop,
      }),
    );

  for (pathname of ["/values", "/other"]) {
    for (const value of [null, undefined, "", " ", "null", "N/A"])
      expect(render(value)).toEqual(["N/A", "N/A"]);
    expect(render("28m")).toEqual(["28m", "28m"]);
    expect(render("0")).toEqual(["0", "0"]);
    mobile = false;
    expect(render(null)).toEqual(["N/A", "N/A"]);
    expect(render("28m")).toEqual(["28,000,000", "28,000,000"]);
    mobile = true;
  }
});
