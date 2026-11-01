import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { fetchCopyTree } from "./copyTree";

test("requests the game ID with source and cancellation, and separates missing history from failures", async () => {
  const tree = {
    title: "Test",
    copies: 0,
    splits: 0,
    history_entries: 0,
    roots: [],
  };
  let response = Response.json(tree);
  const requests: { url: string; options: RequestInit }[] = [];
  const exports = {} as { fetchCopyTree: typeof fetchCopyTree };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./copyTree.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      require: () => ({
        INVENTORY_API_URL: "https://inventory.example",
        INVENTORY_API_SOURCE_HEADER: "test-source",
      }),
      fetch: async (url: string, options: RequestInit) => {
        requests.push({ url, options });
        return response;
      },
    },
  );
  const signal = new AbortController().signal;
  expect(await exports.fetchCopyTree("game/id & copy", signal)).toEqual(tree);
  expect(requests[0]).toEqual({
    url: "https://inventory.example/item/duplicates/tree?id=game%2Fid%20%26%20copy",
    options: {
      headers: { "X-Source": "test-source" },
      cache: "no-store",
      signal,
    },
  });
  response = new Response(null, { status: 404 });
  expect(await exports.fetchCopyTree("game-id")).toBeNull();
  response = new Response(null, { status: 503 });
  await expect(exports.fetchCopyTree("game-id")).rejects.toThrow(
    "Unable to load",
  );
});
