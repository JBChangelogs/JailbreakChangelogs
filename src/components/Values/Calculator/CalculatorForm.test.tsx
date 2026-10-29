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

test.each(["success", "expired", "cancelled"])(
  "share load %s reports its result and consumes the URL without restoring saved items",
  async (outcome) => {
    const exports = {} as { CalculatorForm: (props: unknown) => Element };
    const effects: Array<() => void | (() => void)> = [];
    const stateChanges: Array<{ index: number; value: unknown }> = [];
    const states: unknown[] = [];
    const refs: Array<{ current: unknown }> = [];
    let refIndex = 0;
    const notifications: Array<{ type: string; message: string }> = [];
    const replacedUrls: string[] = [];
    let copiedLink = "";
    let sharedItems: unknown[] = [];
    let stateIndex = 0;
    let resolveShare!: (value: {
      offering: unknown[];
      requesting: unknown[];
    }) => void;
    let rejectShare!: (error: Error) => void;
    let shareSignal: AbortSignal | undefined;
    const share = new Promise<{ offering: unknown[]; requesting: unknown[] }>(
      (resolve, reject) => {
        resolveShare = resolve;
        rejectShare = reject;
      },
    );
    const jsx = (type: unknown, props: Element["props"]): Element => ({
      type,
      props,
    });
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./CalculatorForm.tsx", import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        AbortController,
        Error,
        URL,
        window: {
          location: {
            origin: "https://jailbreakchangelogs.com",
            href: "https://jailbreakchangelogs.com/values/calculator?share=shared-code&keep=yes#items",
          },
          history: {
            replaceState: (_state: unknown, _title: string, url: string) =>
              replacedUrls.push(url),
          },
        },
        navigator: {
          clipboard: {
            writeText: async (link: string) => {
              copiedLink = link;
            },
          },
        },
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react")
            return {
              useState: (initial: unknown) => {
                const index = stateIndex++;
                if (!(index in states)) states[index] = initial;
                return [
                  states[index],
                  (value: unknown) => {
                    states[index] = value;
                    stateChanges.push({ index, value });
                  },
                ];
              },
              useRef: (current: unknown) => {
                const index = refIndex++;
                if (!refs[index]) refs[index] = { current };
                return refs[index];
              },
              useEffect: (effect: () => void) => effects.push(effect),
              useCallback: (callback: unknown) => callback,
            };
          if (name === "@tanstack/react-query")
            return {
              useQueryClient: () => ({}),
              useQuery: () => ({ isPending: true }),
            };
          if (name === "@/contexts/AuthContext")
            return { useAuthContext: () => ({}) };
          if (name === "@/hooks/useUserFavorites")
            return { useUserFavorites: () => ({ data: [] }) };
          if (name === "@/utils/api/userInventoryQuery")
            return { userInventoryQueryOptions: () => ({}) };
          if (name === "@/hooks/useLockBodyScroll")
            return { useLockBodyScroll: () => {} };
          if (name === "@/services/logger") return { createLogger: () => ({}) };
          if (name === "@/utils/storage/safeStorage")
            return {
              safeLocalStorage: { getItem: () => null },
              safeGetJSON: () => {
                throw new Error("Share must take priority over saved items");
              },
            };
          if (name === "./calculatorShare")
            return {
              createCalculatorShare: async (
                offering: unknown[],
                requesting: unknown[],
              ) => {
                sharedItems = [offering, requesting];
                return "aB3x_9Qk";
              },
              loadCalculatorShare: (code: string, signal: AbortSignal) => {
                expect(code).toBe("shared-code");
                shareSignal = signal;
                return share;
              },
            };
          if (name === "sonner")
            return {
              toast: {
                success: (message: string) =>
                  notifications.push({ type: "success", message }),
                error: (message: string) =>
                  notifications.push({ type: "error", message }),
              },
            };
          if (name === "./calculatorUtils")
            return {
              calculateCalculatorTotal: () => 0,
              formatTotalValue: () => "0",
            };
          return { default: name };
        },
      },
    );
    const tree = exports.CalculatorForm({
      initialItems: [],
      shareCode: "shared-code",
    });
    expect(tree.props.disabled).toBe(true);
    const cleanups = effects.map((effect) => effect());
    const offering = [{ id: 123, instanceId: "offering" }];
    const requesting = [{ id: 456, instanceId: "requesting" }];
    if (outcome === "cancelled") {
      for (const cleanup of cleanups)
        if (typeof cleanup === "function") cleanup();
    }
    if (outcome === "expired")
      rejectShare(
        new Error(
          "This calculator share link has expired or could not be found.",
        ),
      );
    else resolveShare({ offering, requesting });
    await new Promise<void>((resolve) => setImmediate(resolve));
    if (outcome === "cancelled") {
      expect(notifications).toEqual([]);
      expect(replacedUrls).toEqual([]);
      expect(stateChanges.some(({ index }) => index === 0 || index === 1)).toBe(
        false,
      );
      return;
    }
    expect(replacedUrls).toEqual(["/values/calculator?keep=yes#items"]);
    if (outcome === "expired") {
      expect(notifications).toEqual([
        {
          type: "error",
          message:
            "This calculator share link has expired or could not be found.",
        },
      ]);
      expect(stateChanges.some(({ index }) => index === 0 || index === 1)).toBe(
        false,
      );
      return;
    }
    expect(notifications).toEqual([
      { type: "success", message: "Shared trade loaded" },
    ]);
    expect(stateChanges).toContainEqual({ index: 0, value: offering });
    expect(stateChanges).toContainEqual({ index: 1, value: requesting });
    expect(
      stateChanges.some(({ index, value }) => index === 3 && value === true),
    ).toBe(false);
    stateIndex = 0;
    refIndex = 0;
    effects.length = 0;
    const loadedTree = exports.CalculatorForm({
      initialItems: [],
      shareCode: "shared-code",
    });
    expect(loadedTree.props.disabled).toBe(false);
    stateIndex = 0;
    refIndex = 0;
    effects.length = 0;
    exports.CalculatorForm({ initialItems: [], shareCode: null });
    effects.find((effect) => effect.toString().includes("hydrateCompact"))!();
    const onShare = elements(loadedTree).find(
      (element) => element.props.onShare,
    )?.props.onShare as () => Promise<void>;
    await onShare();
    expect(sharedItems).toEqual([offering, requesting]);
    expect(copiedLink).toBe(
      "https://jailbreakchangelogs.com/values/calculator?share=aB3x_9Qk",
    );
    for (const cleanup of cleanups)
      if (typeof cleanup === "function") cleanup();
    expect(shareSignal?.aborted).toBe(true);
  },
);
