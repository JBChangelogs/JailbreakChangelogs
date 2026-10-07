import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { FavoriteItem } from "@/types";

type Element = { type: unknown; props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

test("calculator favorites use picker metadata without initial items and roll back only failed changes", async () => {
  const client = new QueryClient();
  const key = ["user-favorites", "user"];
  client.setQueryData<FavoriteItem[]>(key, []);
  const exports = {} as { CalculatorForm: (props: unknown) => Element };
  const responses: Array<(response: { ok: boolean }) => void> = [];
  const jsx = (type: unknown, props: Element["props"]): Element => ({
    type,
    props,
  });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./CalculatorForm.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      fetch: () => new Promise((resolve) => responses.push(resolve)),
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (value: unknown) => [value, () => {}],
            useRef: (current: unknown) => ({ current }),
            useEffect: () => {},
            useCallback: (callback: unknown) => callback,
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => client,
            useQuery: () => ({ isPending: true }),
          };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              user: { id: "user", roblox_id: "123" },
              isAuthenticated: true,
            }),
          };
        if (name === "@/hooks/useUserFavorites")
          return {
            useUserFavorites: () => ({ data: client.getQueryData(key) }),
          };
        if (name === "@/utils/api/userInventoryQuery")
          return { userInventoryQueryOptions: () => ({}) };
        if (name === "@/utils/api/api")
          return {
            INVENTORY_API_URL: "https://inventory.example.com",
            PUBLIC_API_URL: "https://api.example.com",
          };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: () => ({ url: "/favorite", headers: {} }),
          };
        if (name === "@/hooks/useLockBodyScroll")
          return { useLockBodyScroll: () => {} };
        if (name === "@/services/logger") return { createLogger: () => ({}) };
        if (name === "sonner")
          return { toast: { success: () => {}, error: () => {} } };
        if (name === "./calculatorUtils")
          return {
            calculateCalculatorTotal: () => 0,
            formatTotalValue: () => "0",
          };
        return { default: name };
      },
    },
  );
  const renderHandler = () =>
    elements(exports.CalculatorForm({ initialItems: [] })).find(
      (element) => element.props.onToggleFavorite,
    )?.props.onToggleFavorite as (
      id: number,
      favorited: boolean,
      item: FavoriteItem["item"],
    ) => Promise<void>;
  const firstItem = {
    id: 1,
    name: "Torpedo",
    type: "Vehicle",
    cash_value: "30m",
    duped_value: "20m",
    duped_demand: "Low",
    tradable: 1,
    is_limited: 1,
  };
  const secondItem = { id: 2, name: "Brulee", type: "Vehicle" };
  const first = renderHandler()(1, false, firstItem);
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(
    client.getQueryData<FavoriteItem[]>(key)?.map((favorite) => favorite.item),
  ).toEqual([firstItem]);
  const second = renderHandler()(2, false, secondItem);
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(
    client.getQueryData<FavoriteItem[]>(key)?.map((favorite) => favorite.item),
  ).toEqual([firstItem, secondItem]);
  responses[1]({ ok: true });
  await second;
  responses[0]({ ok: false });
  await first;
  expect(
    client.getQueryData<FavoriteItem[]>(key)?.map((favorite) => favorite.item),
  ).toEqual([secondItem]);
  const removal = renderHandler()(2, true, secondItem);
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(client.getQueryData<FavoriteItem[]>(key)).toEqual([]);
  responses[2]({ ok: false });
  await removal;
  expect(
    client.getQueryData<FavoriteItem[]>(key)?.map((favorite) => favorite.item),
  ).toEqual([secondItem]);
  client.clear();
});
