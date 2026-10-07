import { expect, test } from "bun:test";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { fetchUserFavorites } from "@/utils/api/api";
import type { userFavoritesQueryOptions } from "./useUserFavorites";

test("favorites queries retain cached items on API failures while 404 remains empty", async () => {
  let status = 200;
  let body: unknown = [];
  let networkError = false;
  const api = {} as { fetchUserFavorites: typeof fetchUserFavorites };
  const hooks = {} as {
    userFavoritesQueryOptions: typeof userFavoritesQueryOptions;
  };
  for (const [url, exports] of [
    [new URL("../utils/api/api.ts", import.meta.url), api],
    [new URL("./useUserFavorites.ts", import.meta.url), hooks],
  ] as const) {
    runInNewContext(
      transpileModule(readFileSync(url, "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS },
      }).outputText,
      {
        exports,
        process: { env: { NEXT_PUBLIC_API_URL: "https://api.example.com" } },
        fetch: async () => {
          if (networkError) throw new Error("Network unavailable");
          return Response.json(body, { status });
        },
        require: (name: string) => {
          if (name === "@tanstack/react-query") return { queryOptions };
          if (name === "@/utils/api/api") return api;
          if (name === "@/utils/api/apiDevToken")
            return {
              buildApiFetchRequest: () => ({ url: "/favorites", headers: {} }),
            };
          if (name === "@/services/logger")
            return { createLogger: () => ({ error: () => {} }) };
          return {};
        },
      },
    );
  }
  const client = new QueryClient();
  const options = hooks.userFavoritesQueryOptions("user");
  const favorites = [
    { created_at: 1, item: { id: 1, name: "Torpedo", type: "Vehicle" } },
  ];
  client.setQueryData(options.queryKey, favorites);
  status = 500;
  expect(await api.fetchUserFavorites("user")).toBeNull();
  await expect(api.fetchUserFavorites("user", true)).rejects.toThrow(
    "Failed to fetch user favorites",
  );
  await expect(client.fetchQuery(options)).rejects.toThrow(
    "Failed to fetch user favorites",
  );
  expect(client.getQueryData<typeof favorites>(options.queryKey)).toEqual(
    favorites,
  );
  status = 200;
  body = {};
  await expect(client.fetchQuery(options)).rejects.toThrow(
    "Invalid user favorites response",
  );
  expect(client.getQueryData<typeof favorites>(options.queryKey)).toEqual(
    favorites,
  );
  networkError = true;
  await expect(client.fetchQuery(options)).rejects.toThrow(
    "Network unavailable",
  );
  expect(client.getQueryData<typeof favorites>(options.queryKey)).toEqual(
    favorites,
  );
  networkError = false;
  status = 404;
  expect(await api.fetchUserFavorites("user", true)).toBeNull();
  expect(await client.fetchQuery(options)).toEqual([]);
  client.clear();
});
