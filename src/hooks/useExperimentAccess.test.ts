import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { parseExperimentsResponse } from "@/utils/api/experiments";

test("experiment gates require treatment, isolate accounts and overrides, and deny guests and failures", async () => {
  type Options = {
    enabled: boolean;
    queryKey: unknown[];
    queryFn: (context: {
      signal: AbortSignal;
    }) => Promise<Record<string, string>>;
  };
  let options!: Options;
  let data: Record<string, string> | undefined;
  let isError = false;
  let overrides = "";
  let response = Response.json({ experiments: { global_search: "treatment" } });
  const signal = new AbortController().signal;
  const exports = {} as {
    useExperimentAccess: (
      experimentKey: string,
      userId: string | undefined,
      enabled: boolean,
    ) => boolean;
  };
  const imports = {
    react: {
      useSyncExternalStore: (_subscribe: unknown, snapshot: () => string) =>
        snapshot(),
    },
    "@tanstack/react-query": {
      useQuery: (next: Options) => {
        options = next;
        return { data, isError };
      },
    },
    "@/utils/api/apiDevToken": {
      buildApiFetchRequest: (base: string, path: string) => ({
        url: base + path,
        headers: { "X-Experiment": overrides },
      }),
    },
    "@/utils/api/experiments": {
      parseExperimentsResponse,
      getExperimentHeader: () => overrides,
      subscribeExperimentOverrides: () => () => {},
    },
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useExperimentAccess.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (id: keyof typeof imports) => imports[id],
      process: { env: { NEXT_PUBLIC_API_URL: "https://api.example.test" } },
      fetch: async (url: string, init: RequestInit) => {
        expect(url).toBe("https://api.example.test/v2/users/me/experiments");
        expect(init.credentials).toBe("include");
        expect(init.cache).toBe("no-store");
        expect(init.signal).toBe(signal);
        expect(init.headers).toEqual({ "X-Experiment": overrides });
        return response;
      },
    },
  );
  const allowed = exports.useExperimentAccess;
  expect(allowed("global_search", "123", true)).toBe(false);
  expect(options.enabled).toBe(true);
  data = await options.queryFn({ signal });
  expect(allowed("global_search", "123", true)).toBe(true);
  expect(allowed("airdrop_tracker", "123", true)).toBe(false);
  data = { global_search: "control", airdrop_tracker: "treatment" };
  expect(allowed("airdrop_tracker", "123", true)).toBe(true);
  expect(allowed("global_search", "123", true)).toBe(false);
  data = { airdrop_tracker: "control" };
  expect(allowed("airdrop_tracker", "123", true)).toBe(false);
  expect(allowed("airdrop_tracker", undefined, true)).toBe(false);
  expect(allowed("airdrop_tracker", "123", false)).toBe(false);
  allowed("global_search", "123", true);
  expect(options.queryKey).toEqual(["experiment-access", "123", ""]);
  expect(allowed("global_search", undefined, true)).toBe(false);
  expect(options.enabled).toBe(false);
  expect(allowed("global_search", "123", false)).toBe(false);
  expect(options.enabled).toBe(false);
  overrides = "global_search=control";
  allowed("global_search", "456", true);
  expect(options.queryKey).toEqual(["experiment-access", "456", overrides]);
  for (const experiments of [
    { global_search: "control" },
    {},
    { global_search: "unknown" },
  ]) {
    response = Response.json({ experiments });
    data = await options.queryFn({ signal });
    expect(allowed("global_search", "456", true)).toBe(false);
  }
  data = { global_search: "treatment" };
  isError = true;
  expect(allowed("global_search", "456", true)).toBe(false);
  response = new Response(null, { status: 503 });
  await expect(options.queryFn({ signal })).rejects.toThrow("Unable to check");
  response = Response.json({ experiments: { global_search: true } });
  await expect(options.queryFn({ signal })).rejects.toThrow(
    "invalid experiment response",
  );
});
