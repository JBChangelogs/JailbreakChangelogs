import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

test("profile trade ads preserve API messages and empty results with a fallback for invalid errors", async () => {
  let loginConfig: unknown;
  let retries = 0;
  const renderedProps: Record<string, unknown>[] = [];
  let response = Response.json({ detail: "Unauthorized" }, { status: 401 });
  let queryFn!: (context: { signal: AbortSignal }) => Promise<unknown>;
  let queryResult: { isPending: boolean; error?: unknown } = {
    isPending: true,
  };
  const exports = {} as {
    default: (props: { user: { id: string } }) => unknown;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./TradeAdsProfileTab.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      process: { env: { NEXT_PUBLIC_API_URL: "https://api.example.com" } },
      fetch: async () => response,
      require: (name: string) => {
        if (name === "./ProfileTabError") {
          const shared = {};
          runInNewContext(
            transpileModule(
              readFileSync(
                new URL("./ProfileTabError.tsx", import.meta.url),
                "utf8",
              ),
              {
                compilerOptions: {
                  module: ModuleKind.CommonJS,
                  jsx: JsxEmit.ReactJSX,
                },
              },
            ).outputText,
            {
              exports: shared,
              require: (dependency: string) => {
                if (dependency === "react/jsx-runtime") {
                  const jsx = (
                    type: unknown,
                    props: Record<string, unknown>,
                  ) => {
                    renderedProps.push(props);
                    return { type, props };
                  };
                  return { jsx, jsxs: jsx };
                }
                return {};
              },
            },
          );
          return shared;
        }
        if (name === "react/jsx-runtime")
          return {
            jsx: (type: unknown, props: Record<string, unknown>) => {
              renderedProps.push(props);
              if (typeof type === "function") return type(props);
              return { type, props };
            },
            jsxs: (type: unknown, props: unknown) => ({ type, props }),
          };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              setLoginModal: (config: unknown) => {
                loginConfig = config;
              },
            }),
          };
        if (name === "react")
          return { useState: () => [1, () => {}], useEffect: () => {} };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: { queryFn: typeof queryFn }) => {
              queryFn = options.queryFn;
              return { ...queryResult, refetch: () => retries++ };
            },
          };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        return {};
      },
    },
  );
  exports.default({ user: { id: "123" } });
  const context = { signal: new AbortController().signal };
  await expect(queryFn(context)).rejects.toThrow(
    "Sign in to see this user's trade ads.",
  );
  queryResult = {
    isPending: false,
    error: await queryFn(context).catch((e) => e),
  };
  const signInView = JSON.stringify(exports.default({ user: { id: "123" } }));
  expect(signInView).toContain("Sign in required");
  expect(signInView).toContain("heroicons:lock-closed");
  expect(signInView).toContain("h-8 w-8 text-secondary-text");
  expect(signInView).not.toContain("rounded-full");
  expect(signInView).not.toContain("Failed to load trade ads");
  expect(signInView).not.toContain("heroicons:exclamation-triangle");
  const signInButton = renderedProps.find(
    (props) => props.children === "Sign in",
  );
  expect(signInButton).toBeDefined();
  (signInButton!.onClick as () => void)();
  expect(loginConfig).toEqual({ open: true, tab: "discord" });
  const retryButton = renderedProps.find(
    (props) => props.children === "Try again",
  );
  expect(retryButton?.variant).toBe("secondary");
  (retryButton!.onClick as () => void)();
  expect(retries).toBe(1);
  renderedProps.length = 0;
  response = Response.json(
    { message: "Please connect your Roblox account", detail: "Forbidden" },
    { status: 403 },
  );
  await expect(queryFn(context)).rejects.toThrow(
    "Please connect your Roblox account",
  );
  queryResult = {
    isPending: false,
    error: await queryFn(context).catch((e) => e),
  };
  const failureView = JSON.stringify(exports.default({ user: { id: "123" } }));
  expect(failureView).toContain("Failed to load trade ads");
  expect(failureView).toContain("heroicons:exclamation-triangle");
  expect(renderedProps.some((props) => props.children === "Sign in")).toBe(
    false,
  );
  for (const body of [null, { message: " ", detail: [] }, "invalid"]) {
    response = Response.json(body, { status: 500 });
    await expect(queryFn(context)).rejects.toThrow(
      "Failed to fetch trade ads (500)",
    );
  }
  response = new Response("not JSON", { status: 502 });
  await expect(queryFn(context)).rejects.toThrow(
    "Failed to fetch trade ads (502)",
  );
  response = Response.json({ error: "no_trades_found" }, { status: 404 });
  expect(await queryFn(context)).toEqual({ items: [], totalPages: 1 });
});
