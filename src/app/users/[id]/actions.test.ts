import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { fetchFavoritesData, fetchCommentDetails } from "./actions";

test("favorites bound stalled requests and comment details skip unnecessary item lookups", async () => {
  let itemRequests = 0;
  let fetchImpl: (
    input: string,
    init: RequestInit,
  ) => Promise<Response> = async () => Response.json([{ id: 1 }]);
  const exports = {} as {
    fetchFavoritesData: typeof fetchFavoritesData;
    fetchCommentDetails: typeof fetchCommentDetails;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./actions.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ESNext,
        },
      },
    ).outputText,
    {
      exports,
      fetch: (input: string, init: RequestInit) => fetchImpl(input, init),
      AbortSignal: {
        any: AbortSignal.any,
        timeout: (ms: number) => {
          expect(ms).toBe(10_000);
          return AbortSignal.timeout(5);
        },
      },
      require: (name: string) => {
        if (name === "@/utils/api/api")
          return {
            PUBLIC_API_URL: "https://public-api.example.com",
            fetchPartialItems: async () => {
              itemRequests++;
              return [
                { id: 1, name: "Torpedo", type: "Vehicle" },
                { id: 2, name: "Brulee", type: "Vehicle" },
              ];
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
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const suggestionComments = [
    { item_id: 2, item_type: "vsuggestion" },
    { item_id: 2, item_type: "VALUE_SUGGESTION" },
    { item_id: 2, item_type: "tradev2" },
  ];
  expect((await exports.fetchCommentDetails(suggestionComments)).items).toEqual(
    {},
  );
  expect(itemRequests).toBe(0);
  expect(
    (
      await exports.fetchCommentDetails([
        ...suggestionComments,
        { item_id: 1, item_type: "Vehicle" },
      ])
    ).items,
  ).toEqual({ 1: { id: 1, name: "Torpedo", type: "Vehicle" } });
  expect(itemRequests).toBe(1);
  expect(await exports.fetchFavoritesData("123")).toEqual([{ id: 1 }]);
  fetchImpl = async () => Response.json({}, { status: 404 });
  expect(await exports.fetchFavoritesData("123")).toEqual([]);
  fetchImpl = async () => Response.json({}, { status: 500 });
  await expect(exports.fetchFavoritesData("123")).rejects.toThrow(
    "Failed to fetch favorites: 500",
  );

  fetchImpl = async (_input, init) => {
    expect(init.credentials).toBe("include");
    const signal = init.signal!;
    return new Promise((_resolve, reject) => {
      if (signal.aborted) reject(signal.reason);
      else
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
    });
  };
  await expect(exports.fetchFavoritesData("123")).rejects.toThrow();
  const controller = new AbortController();
  const request = exports.fetchFavoritesData("123", controller.signal);
  controller.abort(new Error("Query cancelled"));
  await expect(request).rejects.toThrow("Query cancelled");
});
