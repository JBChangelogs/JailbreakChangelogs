import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("private server 404 responses become empty lists while access errors remain errors", async () => {
  let query: {
    queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
  };
  let status = 404;
  const exports = {} as { default: (props: unknown) => unknown };
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./PrivateServersTab.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      fetch: async () => Response.json({}, { status }),
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: typeof query) => {
              query = options;
              return { data: [], isPending: false };
            },
          };
        if (name === "@/utils/api/api")
          return {
            PUBLIC_API_URL: "https://public-api.example.com",
            getResponseErrorMessage: async () => "Access denied",
          };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        return {};
      },
    },
  );
  exports.default({ userId: "123", isOwnProfile: false });
  const context = { signal: new AbortController().signal };
  expect(await query!.queryFn(context)).toEqual([]);
  status = 403;
  await expect(query!.queryFn(context)).rejects.toThrow("Access denied");
});
