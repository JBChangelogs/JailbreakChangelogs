import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("ban history only requests the signed-in account and disables requests after logout", async () => {
  let viewer: {
    id: string;
    flags: { flag: string; enabled?: boolean }[];
  } | null = { id: "123", flags: [] };
  let query: {
    queryKey: unknown[];
    enabled: boolean;
    queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
  };
  const paths: string[] = [];
  const exports = {} as { default: () => unknown };
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./BanHistory.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      fetch: async (url: string) => {
        paths.push(url);
        return Response.json({ items: [], total: 0 });
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ user: viewer }) };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: typeof query) => {
              query = options;
              return { data: { items: [] } };
            },
          };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://public-api.example.com" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (_base: string, path: string) => ({
              url: path,
              headers: {},
            }),
          };
        return {};
      },
    },
  );
  const context = { signal: new AbortController().signal };
  exports.default();
  expect(query!.enabled).toBe(true);
  await query!.queryFn(context);
  expect(paths).toEqual(["/v2/users/me/bans"]);

  viewer = { id: "789", flags: [{ flag: "is_owner", enabled: true }] };
  exports.default();
  expect(query!.enabled).toBe(true);
  expect(query!.queryKey).toEqual(["account-bans", "789"]);
  await query!.queryFn(context);
  expect(paths).toEqual(["/v2/users/me/bans", "/v2/users/me/bans"]);

  viewer = null;
  expect(exports.default()).toBeNull();
  expect(query!.enabled).toBe(false);
});
