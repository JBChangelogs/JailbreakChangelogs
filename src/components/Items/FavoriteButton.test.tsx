import { expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { FavoriteItem } from "@/types";

type Element = { props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

test("favorite success updates both caches immediately and survives stale requests and refresh failures", async () => {
  for (const count of [2, { count: 2, label: "favorites" }]) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const favoritesKey = ["user-favorites", "user"];
    const countKey = ["item-favorites", 1];
    const item = { id: 1, name: "Torpedo", type: "Vehicle" };
    client.setQueryData<FavoriteItem[]>(favoritesKey, []);
    client.setQueryData(countKey, count);
    client.setQueryData(["item", "id", 1], item);
    const releases: Array<() => void> = [];
    const observers = [favoritesKey, countKey].map((queryKey, index) => {
      let requests = 0;
      return new QueryObserver(client, {
        queryKey,
        staleTime: Infinity,
        queryFn: () => {
          if (++requests > 1) throw new Error("Refresh unavailable");
          return new Promise<unknown>((resolve) =>
            releases.push(() => resolve(index === 0 ? [] : count)),
          );
        },
      });
    });
    const unsubscribes = observers.map((observer) =>
      observer.subscribe(() => {}),
    );
    const staleRequests = observers.map((observer) => observer.refetch());
    let successful = true;
    const exports = {} as { default: (props: unknown) => Element };
    const jsx = (_type: unknown, props: Element["props"]): Element => ({
      props,
    });
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./FavoriteButton.tsx", import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        fetch: async () => ({ ok: successful }),
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react") return { useState: () => [false, () => {}] };
          if (name === "@tanstack/react-query")
            return { useQueryClient: () => client };
          if (name === "@/contexts/AuthContext")
            return { useAuthContext: () => ({ user: { id: "user" } }) };
          if (name === "@/utils/api/apiDevToken")
            return {
              buildApiFetchRequest: () => ({ url: "/favorite", headers: {} }),
            };
          if (name === "@/services/logger")
            return { createLogger: () => ({ error: () => {} }) };
          if (name === "sonner")
            return { toast: { success: () => {}, error: () => {} } };
          return {};
        },
      },
    );
    const click = (favorited: boolean, count: number) => {
      const tree = exports.default({
        itemId: 1,
        isAuthenticated: true,
        initialIsFavorited: favorited,
        initialCount: count,
      });
      return (
        elements(tree).find((element) => element.props.onClick)?.props
          .onClick as () => Promise<void>
      )();
    };
    await click(false, 2);
    expect(
      client
        .getQueryData<FavoriteItem[]>(favoritesKey)
        ?.map((favorite) => favorite.item),
    ).toEqual([item]);
    expect(client.getQueryData<typeof count>(countKey)).toEqual(
      typeof count === "number" ? 3 : { ...count, count: 3 },
    );
    releases.forEach((release) => release());
    await Promise.all(staleRequests);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(
      client
        .getQueryData<FavoriteItem[]>(favoritesKey)
        ?.map((favorite) => favorite.item),
    ).toEqual([item]);
    expect(client.getQueryData<typeof count>(countKey)).toEqual(
      typeof count === "number" ? 3 : { ...count, count: 3 },
    );
    successful = false;
    await click(true, 3);
    expect(client.getQueryData<FavoriteItem[]>(favoritesKey)?.length).toBe(1);
    successful = true;
    await click(true, 3);
    expect(client.getQueryData<FavoriteItem[]>(favoritesKey)).toEqual([]);
    expect(client.getQueryData<typeof count>(countKey)).toEqual(count);
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    client.clear();
  }
});
