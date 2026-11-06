import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

interface Node {
  type: unknown;
  props: Record<string, unknown>;
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("similar items share value cards, favorites, furniture limits and matching loading cards", () => {
  let pending = false;
  let isFavorited = true;
  let refetches = 0;
  const card = Symbol("ItemCard");
  const skeleton = Symbol("ItemCardSkeleton");
  const limits = new Map([[2, 1]]);
  const item = {
    id: 2,
    name: "3D Rex",
    type: "Furniture",
    cash_value: "15m" as string | null,
    duped_value: null,
    demand: "Close To None",
    trend: "Manipulated",
  };
  const noop = () => null;
  const exports = {} as { default: (props: unknown) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./SimilarItems.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return { useState: () => [null, noop], Fragment: "fragment" };
        if (name === "react/jsx-runtime") {
          const jsx = (type: unknown, props: Node["props"]) => ({
            type,
            props,
          });
          return { jsx, jsxs: jsx };
        }
        if (name === "@tanstack/react-query")
          return {
            useQuery: ({ queryKey }: { queryKey: string[] }) => ({
              data:
                queryKey[0] === "similar-item-sorts"
                  ? []
                  : queryKey[0] === "furniture-placement-limits"
                    ? limits
                    : [item],
              isPending: queryKey[0] === "similar-items" && pending,
            }),
          };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ user: { id: "viewer" } }) };
        if (name === "@/hooks/useUserFavorites")
          return {
            useUserFavorites: () => ({
              data: isFavorited ? [{ item: { id: 2 } }] : [],
              refetch: () => {
                refetches++;
                return Promise.resolve();
              },
            }),
          };
        if (name === "./ItemCard") return { default: card };
        if (name === "./ItemCardSkeleton") return { default: skeleton };
        return new Proxy({}, { get: () => noop });
      },
    },
  );
  const render = () => nodes(exports.default({ currentItem: { id: 1 } }));
  const renderedCard = () => render().find((node) => node.type === card)!;
  const count = () =>
    render().find(
      (node) =>
        node.type === "span" &&
        String(node.props.className).includes("ml-1 text-sm font-normal"),
    );
  expect(count()?.props.children).toBe(1);
  expect(renderedCard().props.item).toBe(item);
  expect(renderedCard().props.showValues).toBe(true);
  expect(renderedCard().props.isFavorited).toBe(true);
  expect(renderedCard().props.placementLimit).toBe(1);
  (renderedCard().props.onFavoriteChange as () => void)();
  expect(refetches).toBe(1);
  isFavorited = false;
  expect(renderedCard().props.isFavorited).toBe(false);
  limits.set(2, 0);
  expect(renderedCard().props.placementLimit).toBe(0);
  limits.clear();
  expect(renderedCard().props.placementLimit).toBeNull();
  const grid = () =>
    render().find((node) =>
      String(node.props.className).includes("grid-cols-1"),
    )!;
  const loadedGridClass = grid().props.className;
  pending = true;
  expect(count()).toBeUndefined();
  expect(grid().props.className).toBe(loadedGridClass);
  expect(
    nodes(grid().props.children).filter((node) => node.type === skeleton),
  ).toHaveLength(6);
});
