import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

test("shared seasons query preserves cache, cancellation and rate-limit handling", async () => {
  type Options = {
    queryKey: string[];
    staleTime: number;
    retry: boolean;
    queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
  };
  let response = Response.json([{ season: 33, rewards: [] }]);
  let request: RequestInit | undefined;
  const exports = {} as {
    useSeasonsList: () => Options;
    SeasonListRateLimitError: new (
      retryAfter: number | null,
    ) => Error & { retryAfter: number | null };
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useSeasonsList.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (id: string) =>
        ({
          "@tanstack/react-query": { useQuery: (options: Options) => options },
          "@/utils/api/api": { PUBLIC_API_URL: "https://api.example.test" },
          "@/utils/api/apiDevToken": {
            buildApiFetchRequest: (base: string, path: string) => {
              expect(base + path).toBe("https://api.example.test/v2/seasons");
              return { url: base + path, headers: { "X-Test": "shared" } };
            },
          },
        })[id],
      fetch: async (_url: string, options: RequestInit) => {
        request = options;
        return response;
      },
    },
  );
  const query = exports.useSeasonsList();
  const signal = new AbortController().signal;
  expect(query.queryKey).toEqual(["seasons-list"]);
  expect(query.staleTime).toBe(60_000);
  expect(query.retry).toBe(false);
  expect(await query.queryFn({ signal })).toEqual([
    { season: 33, rewards: [] },
  ]);
  expect(request?.signal).toBe(signal);
  expect(request?.credentials).toBe("include");
  expect(request?.headers).toEqual({
    "X-Test": "shared",
    "User-Agent": "JailbreakChangelogs-Seasons/1.0",
  });
  response = new Response(null, {
    status: 429,
    headers: { "retry-after": "20" },
  });
  try {
    await query.queryFn({ signal });
    throw new Error("Expected rate-limit error");
  } catch (error) {
    expect(error).toBeInstanceOf(exports.SeasonListRateLimitError);
    expect((error as { retryAfter: number }).retryAfter).toBe(20);
  }
  response = new Response(null, { status: 503 });
  await expect(query.queryFn({ signal })).rejects.toThrow(
    "Failed to fetch season list",
  );
});
